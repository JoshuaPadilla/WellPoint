import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'

// Water sources live in Supabase (table public.water_sources, see supabase-water-sources.sql).
// Changes show on screen right away and are then saved; if saving fails, the list is reloaded
// from the database and an error is shown. Citizen reports are in Supabase too (public.reports).
// The database decides who sees which reports (see supabase-reports.sql):
//   LGU -> all open reports, barangay official -> open reports in their barangay,
//   citizen -> their own reports (open and resolved, in `myReports`), DRRM -> none.

export type Role = 'lgu' | 'official' | 'drrm' | 'citizen'
export type AssetKind = 'pump' | 'well' | 'reservoir' | 'station'
export type Status = 'ok' | 'low' | 'empty' | 'repair' | 'unsafe'
export type Issue = 'empty' | 'low' | 'dirty'
export type Asset = { id: string; kind: AssetKind; name: string; lng: number; lat: number; status: Status }
export type Report = {
  id: string
  assetId: string
  issue: Issue
  note: string
  at: number
  reporterName: string
  reporterBarangay: string
  sourceBarangay: string
  resolvedAt: number | null // set when the source was marked Working again
}

export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'citizen', label: 'Citizen', hint: 'Select a water pump or well on the map to report a problem. Follow your reports under My reports.' },
  { id: 'official', label: 'Barangay official', hint: 'Select a water pump or well to read reports from your barangay and change its status.' },
  { id: 'lgu', label: 'LGU', hint: 'Drag pumps, wells and reservoirs onto the map. Drag a marker to move it. Select any marker to change its status or read citizen reports.' },
  { id: 'drrm', label: 'DRRM', hint: 'Drag filling stations onto the map. Drag a marker to move it. Select a station to change its status.' },
]
export const KINDS: Record<AssetKind, string> = { pump: 'Water pump', well: 'Well', reservoir: 'Reservoir', station: 'Filling station' }
export const ISSUES: Record<Issue, string> = { empty: 'No water coming out', low: 'Low flow', dirty: 'Dirty water' }
// Must match public.can_place() in supabase-water-sources.sql.
export const CAN_PLACE: Record<Role, AssetKind[]> = {
  lgu: ['pump', 'well', 'reservoir'],
  drrm: ['station'],
  official: [],
  citizen: [],
}

// Every status a water source can have. `marker` colours the map pin; `badge` the little label.
export const STATUSES: Record<Status, { label: string; badge: string; marker: string }> = {
  ok: { label: 'Working', badge: 'bg-sky text-well', marker: '' },
  low: { label: 'Low / near empty', badge: 'bg-amber-100 text-amber-800', marker: 'bg-amber-500' },
  empty: { label: 'Empty', badge: 'bg-red-100 text-red-700', marker: 'bg-red-600' },
  repair: { label: 'Under repair', badge: 'bg-slate-200 text-slate-700', marker: 'bg-slate-500' },
  unsafe: { label: 'Not safe to drink', badge: 'bg-purple-100 text-purple-800', marker: 'bg-purple-600' },
}
const isStatus = (v: unknown): v is Status => typeof v === 'string' && v in STATUSES

// Out of water or about to be — these show up in Outage alerts.
export const isShort = (s: Status) => s === 'empty' || s === 'low'

// Who may change the status of which kind. Must match public.can_set_status() in the SQL script.
export const CAN_SET_STATUS: Record<Role, AssetKind[]> = {
  lgu: ['pump', 'well', 'reservoir', 'station'],
  drrm: ['station'],
  official: ['pump', 'well'],
  citizen: [],
}

// Pumps and wells can run dry, so they carry a working/empty status and take citizen reports.
export const hasStatus = (kind: AssetKind) => kind === 'pump' || kind === 'well'

type State = {
  role: Role
  assets: Asset[]
  reports: Report[] // open reports this role may see (LGU: all, official: their barangay)
  myReports: Report[] // citizen: every report they filed, newest first
  loading: boolean // true until the first load from Supabase finishes
  error: string | null
}

const KEY = 'wellpoint.demo.v4' // v4: sources and reports are in Supabase, only the role is kept here

const isRole = (v: unknown): v is Role => ROLES.some((r) => r.id === v)
const isKind = (v: unknown): v is AssetKind => v === 'pump' || v === 'well' || v === 'reservoir' || v === 'station'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function loadRole(): Role {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
    const d = raw ? (JSON.parse(raw) as { role?: unknown } | null) : null
    if (d && isRole(d.role)) return d.role
  } catch {
    /* fall through */
  }
  return 'citizen'
}

// crypto.randomUUID only exists on https or localhost, so fall back when it is missing.
const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

let state: State = { role: loadRole(), reports: [], myReports: [], assets: [], loading: true, error: null }
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ role: next.role }))
  } catch {
    /* storage full or blocked: keep working in memory */
  }
  listeners.forEach((l) => l())
}

export function useWaterStore() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}

// ---------- Supabase ----------

type Row = { id: string; kind: string; name: string; lng: number; lat: number; status: string }
const COLUMNS = 'id, kind, name, lng, lat, status'

const toAsset = (r: Row): Asset | null =>
  isKind(r.kind) && isNum(r.lng) && isNum(r.lat)
    ? { id: r.id, kind: r.kind, name: r.name, lng: r.lng, lat: r.lat, status: isStatus(r.status) ? r.status : 'ok' }
    : null

function friendly(message: string) {
  if (/row-level security|permission denied/i.test(message)) return "Your role isn't allowed to make that change."
  if (/fetch|network/i.test(message)) return "Can't reach Supabase. Check your internet connection."
  if (/relation .*water_sources.* does not exist|could not find the table/i.test(message))
    return 'The water_sources table is missing. Run supabase-water-sources.sql in Supabase.'
  return message
}

function fail(message: string) {
  set({ ...state, error: friendly(message) })
  void loadAssets() // put the screen back in line with the database
}

export async function loadAssets() {
  try {
    const { data, error } = await supabase().from('water_sources').select(COLUMNS).order('created_at')
    if (error) throw new Error(error.message)
    const assets = (data as Row[]).map(toAsset).filter((a): a is Asset => a !== null)
    const ids = new Set(assets.map((a) => a.id))
    // Drop reports whose source no longer exists.
    set({
      ...state,
      assets,
      reports: state.reports.filter((r) => ids.has(r.assetId)),
      myReports: state.myReports.filter((r) => ids.has(r.assetId)),
      loading: false,
    })
  } catch (e) {
    set({ ...state, loading: false, error: friendly((e as Error).message) })
  }
}

type ReportRow = {
  id: string
  source_id: string
  issue: string
  note: string | null
  reporter_name: string | null
  reporter_barangay: string | null
  source_barangay: string | null
  created_at: string
  resolved_at: string | null
}

const REPORT_COLUMNS = 'id, source_id, issue, note, reporter_name, reporter_barangay, source_barangay, created_at, resolved_at'

const toReport = (r: ReportRow): Report | null =>
  r.issue in ISSUES
    ? {
        id: r.id,
        assetId: r.source_id,
        issue: r.issue as Issue,
        note: r.note ?? '',
        at: new Date(r.created_at).getTime(),
        reporterName: r.reporter_name ?? '',
        reporterBarangay: r.reporter_barangay ?? '',
        sourceBarangay: r.source_barangay ?? '',
        resolvedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : null,
      }
    : null

// Loads the reports this role is allowed to see. The database filters them (row level security),
// so the same query returns different rows for LGU, officials and citizens.
export async function loadReports() {
  const role = state.role
  if (role === 'drrm') {
    if (state.reports.length || state.myReports.length) set({ ...state, reports: [], myReports: [] })
    return
  }
  try {
    let query = supabase().from('reports').select(REPORT_COLUMNS).order('created_at', { ascending: false })
    if (role !== 'citizen') query = query.is('resolved_at', null) // staff only need open reports
    const { data, error } = await query
    if (error) throw new Error(error.message)
    const list = (data as ReportRow[]).map(toReport).filter((r): r is Report => r !== null)
    if (state.role !== role) return // role changed while loading
    if (role === 'citizen') set({ ...state, myReports: list, reports: [] })
    else set({ ...state, reports: list, myReports: [] })
  } catch (e) {
    const msg = (e as Error).message
    set({
      ...state,
      error: /relation .*reports.* does not exist|could not find the table/i.test(msg)
        ? 'The reports table is missing. Run supabase-reports.sql in Supabase.'
        : friendly(msg),
    })
  }
}

// Resolved reports (newest first) for the Reports page history tab. Same database rules apply:
// LGU gets every barangay, an official only their own. Throws with a readable message on failure.
export async function loadResolvedReports(limit = 200): Promise<Report[]> {
  const { data, error } = await supabase()
    .from('reports')
    .select(REPORT_COLUMNS)
    .not('resolved_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(friendly(error.message))
  return (data as ReportRow[]).map(toReport).filter((r): r is Report => r !== null)
}

// Called by the dashboard once the user is logged in: first load + live updates from other users.
let started = false
export function initWaterStore() {
  if (started) return
  started = true
  void loadAssets()
  void loadReports()
  try {
    let assetTimer: ReturnType<typeof setTimeout> | undefined
    let reportTimer: ReturnType<typeof setTimeout> | undefined
    supabase()
      .channel('wellpoint')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_sources' }, () => {
        clearTimeout(assetTimer)
        assetTimer = setTimeout(() => void loadAssets(), 300) // several changes at once -> one reload
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        clearTimeout(reportTimer)
        reportTimer = setTimeout(() => void loadReports(), 300)
      })
      .subscribe()
  } catch {
    /* Supabase not configured; loadAssets already showed the error */
  }
}

export const dismissError = () => set({ ...state, error: null })

// ---------- actions (same names as before, so the components don't change) ----------

export function setRole(role: Role) {
  if (role === state.role) return
  set({ ...state, role, reports: [], myReports: [] })
  if (started) void loadReports()
}

export function addAsset(kind: AssetKind, lng: number, lat: number) {
  if (!CAN_PLACE[state.role].includes(kind)) return
  // Count up from the highest number in use, so removing a marker never produces a duplicate name.
  const used = new Set(state.assets.map((a) => a.name))
  let n = state.assets.filter((a) => a.kind === kind).length + 1
  while (used.has(`${KINDS[kind]} ${n}`)) n++
  const temp: Asset = { id: `temp-${uid()}`, kind, name: `${KINDS[kind]} ${n}`, lng, lat, status: 'ok' }
  set({ ...state, assets: [...state.assets, temp], error: null })

  void (async () => {
    try {
      const { data, error } = await supabase()
        .from('water_sources')
        .insert({ kind, name: temp.name, lng, lat })
        .select(COLUMNS)
        .single()
      if (error) return fail(error.message)
      const saved = toAsset(data as Row)
      if (!saved) return
      const now = state.assets.find((a) => a.id === temp.id)
      if (!now) return void save((t) => t.delete().eq('id', saved.id).select('id')) // removed while saving
      set({ ...state, assets: state.assets.map((a) => (a.id === temp.id ? { ...saved, lng: now.lng, lat: now.lat } : a)) })
      if (now.lng !== lng || now.lat !== lat) moveAsset(saved.id, now.lng, now.lat) // dragged while saving
    } catch (e) {
      fail((e as Error).message)
    }
  })()
}

// Updates/deletes blocked by security return no error, just zero rows — treat that as "not allowed".
type Table = ReturnType<ReturnType<typeof supabase>['from']>
type Result = { data: unknown[] | null; error: { message: string } | null }

async function save(change: (table: Table) => PromiseLike<Result>) {
  try {
    const { data, error } = await change(supabase().from('water_sources'))
    if (error) return fail(error.message)
    if (!data || data.length === 0) return fail('permission denied')
  } catch (e) {
    fail((e as Error).message)
  }
}

export function moveAsset(id: string, lng: number, lat: number) {
  set({ ...state, assets: state.assets.map((a) => (a.id === id ? { ...a, lng, lat } : a)), error: null })
  if (id.startsWith('temp-')) return // still being created; it will be saved where it was dropped
  void save((t) => t.update({ lng, lat }).eq('id', id).select('id'))
}

export function removeAsset(id: string) {
  set({
    ...state,
    assets: state.assets.filter((a) => a.id !== id),
    reports: state.reports.filter((r) => r.assetId !== id),
    myReports: state.myReports.filter((r) => r.assetId !== id),
    error: null,
  })
  if (id.startsWith('temp-')) return
  void save((t) => t.delete().eq('id', id).select('id'))
}

// Saves a citizen report. `sourceBarangay` is the barangay the source sits in, so that
// barangay's official can see it. Returns an error message, or null when it was sent.
export async function fileReport(assetId: string, issue: Issue, note: string, sourceBarangay: string): Promise<string | null> {
  if (assetId.startsWith('temp-')) return 'This water source is still being saved. Try again in a moment.'
  try {
    const { error } = await supabase()
      .from('reports')
      .insert({ source_id: assetId, issue, note: note.slice(0, 500), source_barangay: sourceBarangay })
    // Show the database's own reason, so a setup problem is easy to spot.
    if (error) return `Couldn't send the report: ${error.message}`
    void loadReports()
    return null
  } catch (e) {
    return friendly((e as Error).message)
  }
}

// Marking a source working also clears its open reports.
export function setStatus(assetId: string, status: Status) {
  const asset = state.assets.find((a) => a.id === assetId)
  if (!asset || !CAN_SET_STATUS[state.role].includes(asset.kind)) return
  set({
    ...state,
    assets: state.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
    reports: status === 'ok' ? state.reports.filter((r) => r.assetId !== assetId) : state.reports,
    error: null,
  })
  if (assetId.startsWith('temp-')) return
  void save((t) => t.update({ status }).eq('id', assetId).select('id'))
}
