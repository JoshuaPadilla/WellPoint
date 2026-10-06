import { useSyncExternalStore } from 'react'

// Stand-in for the backend: everything lives in this module and is saved to localStorage.
// Swap the action functions for API calls later and keep the same names.

export type Role = 'lgu' | 'official' | 'drrm' | 'citizen'
export type AssetKind = 'pump' | 'reservoir' | 'station'
export type Status = 'ok' | 'empty'
export type Issue = 'empty' | 'low' | 'dirty'
export type Asset = { id: string; kind: AssetKind; name: string; lng: number; lat: number; status: Status }
export type Report = { id: string; assetId: string; issue: Issue; note: string; at: number }

export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'citizen', label: 'Citizen', hint: 'Select a water pump on the map to report a problem.' },
  { id: 'official', label: 'Barangay official', hint: 'Select a water pump to read its reports and mark it empty.' },
  { id: 'lgu', label: 'LGU', hint: 'Drag pumps and reservoirs onto the map. Drag a marker to move it.' },
  { id: 'drrm', label: 'DRRM', hint: 'Drag filling stations onto the map. Drag a marker to move it.' },
]
export const KINDS: Record<AssetKind, string> = { pump: 'Water pump', reservoir: 'Reservoir', station: 'Filling station' }
export const ISSUES: Record<Issue, string> = { empty: 'No water coming out', low: 'Low flow', dirty: 'Dirty water' }
export const CAN_PLACE: Record<Role, AssetKind[]> = {
  lgu: ['pump', 'reservoir'],
  drrm: ['station'],
  official: [],
  citizen: [],
}

type State = { role: Role; assets: Asset[]; reports: Report[] }

// Fake demo data. Positions are approximate and a few pumps are empty or reported so every dashboard view has something to show.
// Replace with the real pumps once the LGU adds them.
const seed: Asset[] = [
  { id: 'a1', kind: 'pump', name: 'Poblacion pump', lng: 124.8838, lat: 11.7762, status: 'ok' },
  { id: 'a2', kind: 'pump', name: 'Muñoz pump', lng: 124.8826, lat: 11.7842, status: 'empty' },
  { id: 'a3', kind: 'pump', name: 'San Roque pump', lng: 124.8345, lat: 11.8075, status: 'ok' },
  { id: 'a4', kind: 'reservoir', name: 'Maulong reservoir', lng: 124.878, lat: 11.796, status: 'ok' },
  { id: 'a5', kind: 'station', name: 'City hall filling station', lng: 124.8855, lat: 11.774, status: 'ok' },
  { id: 'a6', kind: 'pump', name: 'Mercedes pump', lng: 124.8905, lat: 11.7705, status: 'empty' },
  { id: 'a7', kind: 'pump', name: 'Guindapunan pump', lng: 124.901, lat: 11.789, status: 'ok' },
  { id: 'a8', kind: 'pump', name: 'Maulong pump', lng: 124.8795, lat: 11.7945, status: 'empty' },
  { id: 'a9', kind: 'pump', name: 'Canlapwas pump', lng: 124.87, lat: 11.765, status: 'ok' },
  { id: 'a10', kind: 'pump', name: 'Pupua pump', lng: 124.86, lat: 11.8, status: 'empty' },
  { id: 'a11', kind: 'station', name: 'Cagutian filling station', lng: 124.881, lat: 11.781, status: 'ok' },
]

const ago = (minutes: number) => Date.now() - minutes * 60_000
const seedReports: Report[] = [
  { id: 'r1', assetId: 'a2', issue: 'empty', note: 'Nothing comes out since this morning.', at: ago(35) },
  { id: 'r2', assetId: 'a2', issue: 'low', note: '', at: ago(180) },
  { id: 'r3', assetId: 'a6', issue: 'empty', note: 'Queue of about 20 households.', at: ago(95) },
  { id: 'r4', assetId: 'a8', issue: 'empty', note: '', at: ago(260) },
  { id: 'r5', assetId: 'a8', issue: 'dirty', note: 'Brown water the day before it ran dry.', at: ago(1500) },
  { id: 'r6', assetId: 'a10', issue: 'empty', note: 'Dry for two days.', at: ago(2900) },
  { id: 'r7', assetId: 'a7', issue: 'low', note: 'Very slow, takes 10 minutes to fill a pail.', at: ago(60) },
  { id: 'r8', assetId: 'a1', issue: 'dirty', note: 'Cloudy water.', at: ago(420) },
]

const KEY = 'wellpoint.demo.v2' // bumped so browsers drop the old saved demo and load this data

const isRole = (v: unknown): v is Role => ROLES.some((r) => r.id === v)
const isKind = (v: unknown): v is AssetKind => v === 'pump' || v === 'reservoir' || v === 'station'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

// Saved data may be old, hand-edited or half-written, so check its shape instead of trusting it.
function parse(raw: string): State | null {
  const d = JSON.parse(raw) as Partial<State> | null
  if (!d || !Array.isArray(d.assets) || !Array.isArray(d.reports)) return null
  const assets = d.assets.filter(
    (a): a is Asset =>
      !!a && typeof a.id === 'string' && isKind(a.kind) && typeof a.name === 'string' && isNum(a.lng) && isNum(a.lat) && (a.status === 'ok' || a.status === 'empty'),
  )
  const ids = new Set(assets.map((a) => a.id))
  const reports = d.reports.filter(
    (r): r is Report => !!r && typeof r.id === 'string' && ids.has(r.assetId) && r.issue in ISSUES && isNum(r.at),
  )
  return { role: isRole(d.role) ? d.role : 'citizen', assets, reports }
}

function load(): State {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
    const saved = raw ? parse(raw) : null
    if (saved) return saved
  } catch {
    /* fall through to the seed */
  }
  return { role: 'citizen', assets: seed, reports: seedReports }
}

// crypto.randomUUID only exists on https or localhost, so fall back when it is missing.
const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

let state = load()
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
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

export const setRole = (role: Role) => set({ ...state, role })

export function addAsset(kind: AssetKind, lng: number, lat: number) {
  if (!CAN_PLACE[state.role].includes(kind)) return
  // Count up from the highest number in use, so removing a marker never produces a duplicate name.
  const used = new Set(state.assets.map((a) => a.name))
  let n = state.assets.filter((a) => a.kind === kind).length + 1
  while (used.has(`${KINDS[kind]} ${n}`)) n++
  const asset: Asset = { id: uid(), kind, name: `${KINDS[kind]} ${n}`, lng, lat, status: 'ok' }
  set({ ...state, assets: [...state.assets, asset] })
}

export const moveAsset = (id: string, lng: number, lat: number) =>
  set({ ...state, assets: state.assets.map((a) => (a.id === id ? { ...a, lng, lat } : a)) })

export const removeAsset = (id: string) =>
  set({
    ...state,
    assets: state.assets.filter((a) => a.id !== id),
    reports: state.reports.filter((r) => r.assetId !== id),
  })

export const fileReport = (assetId: string, issue: Issue, note: string) =>
  set({ ...state, reports: [...state.reports, { id: uid(), assetId, issue, note, at: Date.now() }] })

// Marking a pump working also clears its open reports.
export const setStatus = (assetId: string, status: Status) =>
  set({
    ...state,
    assets: state.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
    reports: status === 'ok' ? state.reports.filter((r) => r.assetId !== assetId) : state.reports,
  })