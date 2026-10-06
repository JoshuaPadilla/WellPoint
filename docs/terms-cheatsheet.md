# WellPoint — Terms & Definitions Cheatsheet

For the presenter, for the Q&A, and for the judge who asks "wait, what does that
number actually mean?". Every term here is the **exact definition used in the
code** (`frontend/src/lib/{derive,metrics,vulnerability,alerts,seed}.ts`), not a
marketing paraphrase. If a judge asks "where does that come from?", you can point
at the rule and the threshold.

> Golden rule to repeat: **"Nothing here is hand-labeled. Every score and status
> is *derived* from live signals, and every rule and threshold is visible in the
> code — there is no black box."**

---

## 1. The five numbers on the dashboard (the KPIs)

| KPI | Definition (exact) | Where it comes from | "So what?" answer |
| :--- | :--- | :--- | :--- |
| **Status band** | `Secure` if score ≥ 75, `Watch` if ≥ 50, else `Critical`. | `metrics.ts:39` | The headline answer: is the city OK right now? |
| **Water-security score** | `0.4×accessCoverage + 0.3×reliability + 0.3×affordability − alertPenalty`, clamped 0–100. | `metrics.ts:38` | One number that weighs **who can reach water** most (40%), then how reliably (30%) and affordably (30%), minus a penalty for active alerts. |
| **Access coverage (%)** | Share of population whose barangay is **not underserved** (`served` or `partial`). | `metrics.ts:21,34` | Not the number of systems — the number of **people** who have at least partial access. |
| **Reliability (%)** | Population-weighted mean of `flow %` (a barangay that is offline counts as 0% flow). | `metrics.ts:23,35` | On an average day, how much of normal water flow is actually reaching people? |
| **Affordability (0–100)** | Population-weighted mean of per-barangay affordability (a proxy index, see §4). | `metrics.ts:24,36` | Capacity to pay for water — also drives vulnerability and "Served" status. |
| **Active alerts** | Count of `critical + warning + info` alerts with status `active`. | `metrics.ts:27-32,45` | The incident list. Each one has a cause and a recommended action. |

**Alert penalty:** `min(30, 10 per critical alert + 4 per warning + 1 per info)`
(`metrics.ts:37`). One critical alert alone costs 10 points — so a typhoon
visibly moves the band.

---

## 2. Per-barangay status: Flow, Quality, Affordability, System level

Every barangay gets an **effective service status** computed from three possible
sources, in this order of precedence (`derive.ts:13-33`):

1. An **LGU override** (`barangay_status` table) if the LGU typed one in.
2. A **pilot system's seeded status** if the barangay has a pilot water system.
3. A **geography-derived baseline** for the other ~52 barangays.

### Flow (%) — "how much water is flowing"
- **Means:** current output as a percentage of that system's **normal** output. It is a *supply level*, not a pressure or volume.
- Where it comes from:
  - **Pilot systems:** the last tick of a deterministic seeded series, e.g. Poblacion ≈ 91%, Canlapwas ≈ 45% (`seed.ts:62-68`).
  - **Non-pilot barangays:** `100 − isolation × 76` (i.e. no system, geography only) — bigger/farther barangays score lower flow (`seed.ts:86-88`).
  - **LGU override or demo disruption:** whatever the responsible user set.
- **Thresholds that matter:** flow < 25 → **critical shortage** alert; flow < 40 → **warning**; flow 40–59 with a 3-tick decline → **early-warning** alert (`alerts.ts:83-122`).

### Quality — "is the water safe?"
- **A value, not a number:** `safe` | `advisory` | `unsafe` (`types.ts:12`).
  - `safe` — ok to drink as supplied.
  - `advisory` — under a boil-water / use-with-caution advisory.
  - `unsafe` — **not safe to drink**.
- **Threshold that matters:** `unsafe` → **critical contamination alert**; `advisory` → **warning** (`alerts.ts:73-112`). `unsafe` also forces the barangay to **underserved** (§3).
- **Important caveat for judges:** this is simulated/labeled data in the prototype. In production it would come from lab results or telemetry.

### Affordability — "an index, not a price"
- **Means:** a 0–100 **proxy index** of a barangay's capacity to pay for water service — *not* a peso price and *not* a utility bill.
- Where it comes from: a seeded value per barangay (pilot systems have fixed values like Poblacion 80, Canlapwas 25; others 45–75, `seed.ts:54-58,131`). The LGU can override it on the **Water status** page.
- **Threshold that matters:** a barangay is only **Served** if affordability ≥ **35** (`derive.ts:8,43`). It also feeds **vulnerability** (§5): lower affordability → less spare capacity → more vulnerable (`vulnerability.ts:39`).

### System level (Service Level I / II / III)
- **Means:** the *type* of water system, per Philippine national standard —
  - **Level I** (Point source): springs/wells, individual standpoints; e.g. Canlapwas (10 h/day, barangay-council operated).
  - **Level II** (Communal): piped to communal tap stands; e.g. San Andres, Mercedes.
  - **Level III** (Individual): piped to households with individual connections; e.g. Poblacion 1 (24 h/day, water-district operated).
- It is reference metadata from `water_systems` (`types.ts:27-36`), shown in the barangay drill-down ("Level II · 18 h/day").
- **Why it matters to the model:** higher level = lower **vulnerability risk** score (Level III = 0, II = 0.4, I = 0.8, no system = 1.0) (`vulnerability.ts:8-13`).

---

## 3. Access state — the color of each barangay

**The single most important concept in the product.** Remember:
> **"Covered ≠ accessed."** A barangay can sit right next to a spring and still be
> **underserved** — because the tool measures *derivation rules*, not proximity.

Each barangay is **derived** into one of three states (`derive.ts:40-45`):

| State | Rule (all must hold) |
| :--- | :--- |
| **Served** (green) | System available **and** flow ≥ 40% **and** quality = safe **and** affordability ≥ 35 |
| **Partial** (amber) | Nothing on the "underserved" list, but fails at least one "served" condition |
| **Underserved** (red) | System **offline** **or** quality = unsafe **or** flow < 25 |

- Access is **never stored** — it is recomputed on every update (report, warning,
  LGU status change, source status). That means the map colors change live and
  the score "cannot be gamed by its own labels" (`metrics.ts:1-3`).
- **Judge question:** "Why is Canlapwas red when it has a spring?" → "Because a
  source near the community is not the same as *access*. Canlapwas' quality is
  unsafe and its affordability is low, so the rules mark it underserved."

---

## 4. Vulnerability — the forward-looking part

**Structural vulnerability** (not the access color) predicts how *bad* a disruption would be in a barangay. It is `low` | `medium` | `high` (`vulnerability.ts`).

**Formula (all three factors are shown in the drill-down):**

```
score = 0.5 × isolation + 0.3 × levelRisk + 0.2 × (1 − capacityMargin)
high    if score ≥ 0.60
medium  if score ≥ 0.35
low     otherwise
```

| Factor | Definition | Where it comes from |
| :--- | :--- | :--- |
| **Isolation (0–1)** | `0.5 × min(1, area/10 km²) + 0.5 × min(1, distance/15 km)` from the Poblacion center — computed from the **real barangay polygon geometry**. | `seed.ts:80-83` |
| **Level risk** | Level III = 0, II = 0.4, I = 0.8, no system = 1.0. | `vulnerability.ts:8-13` |
| **Capacity margin (0–1)** | `affordability / 100` — lower affordability → less spare capacity → more vulnerable. | `vulnerability.ts:39` |

**Why it's on the cheatsheet:** vulnerability does real work —
- It **escalates** alerts: an outage/contamination in a high-vulnerability barangay becomes a **priority critical** alert with an impact note (`alerts.ts:129-133`).
- It **sorts** the alert list: severity first, then **high-vulnerability (underserved) barangays first** — that is the equity mechanism ("who to serve first") (`alerts.ts:257-266`).

---

## 5. Alerts — types, severities, and how they resolve

Alerts are the decision engine, not a display decoration. They are **derived** —
never hand-entered — except LGU/DRRM **warnings** (label always shows the source).

| Fact | Detail |
| :--- | :--- |
| **Three types** | `shortage` · `contamination` · `outage` (`types.ts:102`) |
| **Three severities** | `critical` (−10 pts) · `warning` (−4 pts) · `info` (−1 pt) in the score penalty (`metrics.ts:37`) |
| **Four signal sources** | ① system status (flow/quality/availability) ② water-source marker status ③ new community reports ④ LGU/DRRM-authored warnings (`alerts.ts:152-246`) |
| **Sort order** | severity, then **high-vulnerability first**, then barangay name (`alerts.ts:257`) |

**Alert thresholds (memorize at least these three):**
- System **offline** → critical outage alert.
- Quality **unsafe** → critical contamination alert.
- Flow **< 25** → critical shortage; **< 40** → warning shortage; **declining** (3 ticks down) with flow < 60 → early-warning.
- Source marker `unsafe`/`empty`/`repair`/`low` → warning/info alerts.
- A **new** report (`contamination`/`no_water`/`infrastructure_damage`/`low_pressure`) → immediately raises an alert.

**How an alert is cleared (the "who resolves it" answer):**

| Type of alert | Who clears it | How | RLS bound |
| :--- | :--- | :--- | :--- |
| Report-driven | **Barangay official** | Reports page: Acknowledge → Resolve | own barangay only (`schema.sql` `can_triage_report`) |
| Warning-driven | **LGU / DRRM author** | Warnings page: Resolve / Cancel | lgu, or drrm own |
| Source-status | **Barangay official / DRRM** | Sources page or map marker popup: change status | own barangay (official); stations (drrm) |
| System-status | **LGU water office** | Water status page: edit, or "Restore seeded" | lgu/water district only (`canEditBarangayStatus`) |

Every resolution propagates to **all users live** via Supabase Realtime — no refresh.

---

## 6. Roles & permissions (who can do what)

| Role | Can do | Cannot do |
| :--- | :--- | :--- |
| **Resident (citizen)** | See map/status, submit reports, view own barangay alerts | Manage status, sources, or users |
| **Barangay official** | Submit/triage **own barangay** reports, add & set status of **own barangay** sources (boundary-checked), see own barangay | Edit LGU status, manage users, touch other barangays |
| **LGU / Water District** | See everything; set per-barangay status; assign roles & officials; demo controls; manage users | (permission ceiling) |
| **DRRM** | Issue/resolve early warnings, manage **stations**, plan deliveries | Set barangay status (LGU only) / roles |

- Enforcement is **row-level security in Supabase** (per-role, per-barangay), plus RLS helper functions that are `SECURITY DEFINER` to avoid recursion.
- **Official assignment:** officials are **real registered users**. The LGU picks one on the **Users** page or the map drill-down; until then the card says **"None assigned yet."**

---

## 7. Barangay drill-down card — field-by-field

Opens when you tap a barangay on the map. Exact sources:

| Field | Meaning / source |
| :--- | :--- |
| **Population** | Real modeled population from `barangays` (Community record). |
| **Water sources** | Count of `water_sources` recorded inside that barangay's polygon (`store.ts:96`). |
| **Flow** | Effective flow % (§2). Offline systems append "· offline". |
| **Quality** | Effective `safe` / `advisory` / `unsafe` (§2). |
| **Affordability** | *Effective* affordability — LGU override wins over the seeded value (§2). |
| **System** | Serving pilot system: "Level I · 12 h/day", no system → **"No pilot system"**. |
| **Vulnerability** | Tier + the three-factor breakdown (isolation, level, capacity margin) — §4. |
| **Barangay official** | Registered user with role `official` assigned to that barangay; **name + email (no fake directory)**; "None assigned yet" until the LGU assigns one. |
| **Alerts** | The barangay's active alerts with messages and actions. |

---

## 8. Judge-trap terms (say the right word)

| Don't say | Say | Why it matters |
| :--- | :--- | :--- |
| "Covered" | "Has access" / "served or partial" | Covered ≠ accessed. This is the challenge's core sentence. |
| "Sensor data" / "live telemetry" | "**Simulated** water data, clearly labeled" | Saying it first builds trust; the boundaries and user data are real. |
| "A notification system" | "**Decision-support** / early-warning" | Alerts surface and prioritize; they don't dispatch crews. |
| "Labeled / declared status" | "**Derived** status" | Nothing is hand-stamped; rules compute it from signals. |
| "A map app" | "An access **read model** on a map" | The map is the surface; the derivation + priority is the product. |
| "This barangay is poor" | "Low affordability index (≤ 35 → can't be 'Served')" | Affordability is a model proxy, and it's visible in the breakdown. |
| "Vulnerability = danger score" | "**Structural** vulnerability from geometry + level + capacity margin" | It's forward-looking, not a measurement of current damage. |
| "The score is gameable" | "The score is derived from signals — overriding a label is exactly the LGU's *job*" | LGU edits are the workflow, not a cheat; and outsiders can't write rows (RLS). |
| "No backend" | "**No separate backend** — React + Supabase (Postgres/Auth/Realtime)" | People hear "no backend" as "no data." |

---

## 9. Quick numbers to have on demand

| Number | Value |
| :--- | :--- |
| Barangays | **57** real, PSGC-coded boundaries |
| Pilot water systems | **5** (Level I, II, III mix) |
| Served affordability floor | **≥ 35** |
| Underserved triggers | flow < **25** OR quality = unsafe OR offline |
| Partial vs served | flow 25–39, or any quality ≤ advisory, or affordability < 35 |
| Alert penalty | **10 / 4 / 1** per critical/warning/info, capped at 30 |
| Vulnerability tiers | high ≥ **0.60**, medium ≥ **0.35** |
| Score band | Secure ≥ 75, Watch ≥ 50, Critical < 50 |
| Official assignment | real registered users; "None assigned yet" before assignment |