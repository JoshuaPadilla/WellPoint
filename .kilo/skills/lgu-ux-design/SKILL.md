---
name: lgu-ux-design
description: Use when designing or reviewing the WellPoint interface for LGU staff and community users — layout, navigation, dashboards, accessibility, mobile-first, status colors, empty/loading/error states, or overall demo polish. Trigger when improving usability or visual design, since UX & Design is 13% of Level 2 scoring.
---

# LGU UX Design — Clear, Accessible, Demo-Ready

UX & Design is **13% of Level 2**, and a confusing demo undermines the 27% functionality score. Design for busy LGU staff and community members, often on phones and low bandwidth.

## Who you are designing for

- **LGU water/engineering staff** — need at-a-glance status, alerts, and where to act first.
- **Barangay officials** — need to report problems and see their area's status.
- **Community members** — need simple answers: is my water available, safe, and affordable?

Design the primary flow around one persona. Do not build a "generic admin dashboard."

## Principles

1. **Answer the core question in 5 seconds.** On load, the user should see whether water is secure or at risk for their area.
2. **Progressive disclosure.** Summary first, drill-down second. No wall of charts on the landing view.
3. **Mobile-first.** Use Tailwind responsive utilities; test at ~375px width.
4. **Plain language.** "No water expected in Barangay X for 6 hours," not "flow deficit anomaly detected."
5. **Local context.** Use Region VIII barangay/municipality names and local terminology.

## Dashboard patterns

- **Status banner**: overall condition (Secure / Watch / Critical) with one sentence and the affected area.
- **KPI cards**: coverage %, service hours, active alerts, affordability indicator — each with a trend or status color.
- **Map or coverage grid**: served vs underserved areas, source locations, active alerts.
- **Alerts list**: severity, area, time, status, and a recommended action.
- **Report entry**: 3–4 fields max (area, type, description, optional photo), with a clear success confirmation.

## Status colors and semantics

Use one consistent scale everywhere and never rely on color alone (add icon/text):

- Green = secure / safe / available
- Amber = watch / advisory / low
- Red = critical / unsafe / offline
- Gray = unknown / no data

Ensure sufficient contrast (WCAG AA) and label each state in text.

## Accessibility and robustness

- Semantic HTML, labeled inputs, keyboard-navigable controls.
- Sufficient text size and tap targets (≥44px) for outdoor/phone use.
- Provide **loading**, **empty**, and **error** states for every data view; the error state must fall back to bundled seed data rather than a blank screen.
- Never show a raw stack trace or an unhandled promise to a judge.

## Demo polish checklist

- [ ] Landing view states the water-security status for a named area
- [ ] Every data view has loading / empty / error states
- [ ] Status colors are consistent and also labeled in text
- [ ] Works at 375px width with no horizontal scroll
- [ ] No placeholder/lorem text or broken images visible
- [ ] Primary action (report, view alerts, simulate disruption) is reachable in one click
- [ ] Contrast and tap targets pass a quick manual check

## Guardrails

- Prefer Tailwind utilities and a small set of shared components over a heavy UI library.
- Keep the design system minimal: one font scale, one spacing rhythm, one color scale.
- Do not let visual polish consume build time before the Must features work.
