import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'

// Water sources live in Supabase (table public.water_sources, see supabase-water-sources.sql).
// Changes show on screen right away and are then saved; if saving fails, the list is reloaded
// from the database and an error is shown. Reports and the current role stay in this browser for now.

export type Role = 'lgu' | 'official' | 'drrm' | 'citizen'
export type AssetKind = 'pump' | 'well' | 'reservoir' | 'station'
export type Status = 'ok' | 'empty'
export type Issue = 'empty' | 'low' | 'dirty'
export type Asset = { id: string; kind: AssetKind; name: string; lng: number; lat: number; status: Status }
export type Report = { id: string; assetId: string; issue: Issue; note: string; at: number }

export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'citizen', label: 'Citizen', hint: 'Select a water pump or well on the map to report a problem.' },
  { id: 'official', label: 'Barangay official', hint: 'Select a water pump or well to read its reports and mark it empty.' },
  { id: 'lgu', label: 'LGU', hint: 'Drag pumps, wells and reservoirs onto the map. Drag a marker to move it.' },
  { id: 'drrm', label: 'DRRM', hint: 'Drag filling stations onto the map. Drag a marker to move it.' },
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

// Pumps and wells can run dry, so they carry a working/empty status and take citizen reports.
export const hasStatus = (kind: AssetKind) => kind === 'pump' || kind === 'well'

type State = {
  role: Role
  assets: Asset[]
  reports: Report[]
  loading: boolean // true until the first load from Supabase finishes
  error: string | null
}

// Demo reports point at the demo sources the SQL script inserts (same fixed ids).
const demoId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const ago = (minutes: number) => Date.now() - minutes * 60_000
const seedReports: Report[] = [
  { id: 'r1', assetId: demoId(2), issue: 'empty', note: 'Nothing comes out since this morning.', at: ago(35) },
  { id: 'r2', assetId: demoId(2), issue: 'low', note: '', at: ago(180) },
  { id: 'r3', assetId: demoId(6), issue: 'empty', note: 'Queue of about 20 households.', at: ago(95) },
  { id: 'r4', assetId: demoId(8), issue: 'empty', note: '', at: ago(260) },
  { id: 'r5', assetId: demoId(8), issue: 'dirty', note: 'Brown water the day before it ran dry.', at: ago(1500) },
  { id: 'r6', assetId: demoId(10), issue: 'empty', note: 'Dry for two days.', at: ago(2900) },
  { id: 'r7', assetId: demoId(7), issue: 'low', note: 'Very slow, takes 10 minutes to fill a pail.', at: ago(60) },
  { id: 'r8', assetId: demoId(1), issue: 'dirty', note: 'Cloudy water.', at: ago(420) },
]

const KEY = 'wellpoint.demo.v3' // v3: sources moved to Supabase, only role + reports are kept here

const isRole = (v: unknown): v is Role => ROLES.some((r) => r.id === v)
const isKind = (v: unknown): v is AssetKind => v === 'pump' || v === 'well' || v === 'reservoir' || v === 'station'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function loadLocal(): Pick<State, 'role' | 'reports'> {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
    const d = raw ? (JSON.parse(raw) as Partial<State> | null) : null
    if (d && Array.isArray(d.reports)) {
      const reports = d.reports.filter(
        (r): r is Report => !!r && typeof r.id === 'string' && typeof r.assetId === 'string' && r.issue in ISSUES && isNum(r.at),
      )
      return { role: isRole(d.role) ? d.role : 'citizen', reports }
    }
  } catch {
    /* fall through to the seed */
  }
  return { role: 'citizen', reports: seedReports }
}

// crypto.randomUUID only exists on https or localhost, so fall back when it is missing.
const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

let state: State = { ...loadLocal(), assets: [], loading: true, error: null }
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ role: next.role, reports: next.reports }))
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
    ? { id: r.id, kind: r.kind, name: r.name, lng: r.lng, lat: r.lat, status: r.status === 'empty' ? 'empty' : 'ok' }
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
    set({ ...state, assets, reports: state.reports.filter((r) => ids.has(r.assetId)), loading: false })
  } catch (e) {
    set({ ...state, loading: false, error: friendly((e as Error).message) })
  }
}

// Called by the dashboard once the user is logged in: first load + live updates from other users.
let started = false
export function initWaterStore() {
  if (started) return
  started = true
  void loadAssets()
  try {
    let timer: ReturnType<typeof setTimeout> | undefined
    supabase()
      .channel('water_sources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_sources' }, () => {
        clearTimeout(timer)
        timer = setTimeout(() => void loadAssets(), 300) // several changes at once -> one reload
      })
      .subscribe()
  } catch {
    /* Supabase not configured; loadAssets already showed the error */
  }
}

export const dismissError = () => set({ ...state, error: null })

// ---------- actions (same names as before, so the components don't change) ----------

export const setRole = (role: Role) => set({ ...state, role })

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
    error: null,
  })
  if (id.startsWith('temp-')) return
  void save((t) => t.delete().eq('id', id).select('id'))
}

export const fileReport = (assetId: string, issue: Issue, note: string) =>
  set({ ...state, reports: [...state.reports, { id: uid(), assetId, issue, note, at: Date.now() }] })

// Marking a pump or well working also clears its open reports.
export function setStatus(assetId: string, status: Status) {
  set({
    ...state,
    assets: state.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
    reports: status === 'ok' ? state.reports.filter((r) => r.assetId !== assetId) : state.reports,
    error: null,
  })
  void save((t) => t.update({ status }).eq('id', assetId).select('id'))
}
