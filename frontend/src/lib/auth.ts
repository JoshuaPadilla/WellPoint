// Register / login straight against Supabase Auth — no separate backend needed.
// Name and barangay go along with the signup; a database trigger copies them into
// the public.profiles table (see supabase-profiles.sql), which also holds the role.
import type { User as SupaUser } from '@supabase/supabase-js'
import type { Role } from '@/lib/water-store'
import { supabase } from './supabase'

export type User = { id: string; name: string; email: string; barangay: string; role: Role }

const ROLES: Role[] = ['citizen', 'official', 'lgu', 'drrm']
const asRole = (v: unknown): Role => (ROLES.includes(v as Role) ? (v as Role) : 'citizen')

const USER_KEY = 'wellpoint.user'

// Thrown when a request fails; `fields` maps form field names to messages.
export class ApiError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) {
    super(message)
  }
}

const text = (form: FormData, k: string) => String(form.get(k) ?? '').trim()

// Fallback when the profiles table can't be read: use what was sent at signup.
function fromMetadata(u: SupaUser): User {
  return {
    id: u.id,
    email: u.email ?? '',
    name: String(u.user_metadata?.name ?? ''),
    barangay: String(u.user_metadata?.barangay ?? ''),
    role: 'citizen',
  }
}

// Reads the user's row from public.profiles. With touchLogin, first stamps last_login_at.
async function loadProfile(u: SupaUser, touchLogin: boolean): Promise<User> {
  const db = supabase()
  if (touchLogin) {
    const { error } = await db.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', u.id)
    if (error) console.warn('Could not save login time:', error.message)
  }
  const { data, error } = await db.from('profiles').select('id, name, barangay, email, role').eq('id', u.id).maybeSingle()
  if (error || !data) {
    console.warn('Could not load profile, using signup data instead:', error?.message ?? 'no profile row')
    return fromMetadata(u)
  }
  return {
    id: data.id,
    email: data.email || u.email || '',
    name: data.name,
    barangay: data.barangay,
    role: asRole(data.role),
  }
}

async function remember(u: SupaUser, touchLogin: boolean) {
  const user = await loadProfile(u, touchLogin)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (touchLogin) refreshed = Promise.resolve(user)
  return user
}

// Re-reads the profile once per page load, so a role changed in Supabase shows up
// without logging out and back in.
let refreshed: Promise<User | null> | null = null
export function refreshProfile(): Promise<User | null> {
  refreshed ??= (async () => {
    try {
      const { data } = await supabase().auth.getSession()
      return data.session ? await remember(data.session.user, false) : null
    } catch {
      return getUser()
    }
  })()
  return refreshed
}

function client() {
  try {
    return supabase()
  } catch (e) {
    throw new ApiError((e as Error).message)
  }
}

// Returns the user when they're logged in right away, or null when Supabase
// wants them to confirm their email first.
export async function register(form: FormData): Promise<User | null> {
  const { data, error } = await client().auth.signUp({
    email: text(form, 'email').toLowerCase(),
    password: String(form.get('password') ?? ''),
    options: { data: { name: text(form, 'name'), barangay: text(form, 'barangay') } },
  })

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      const msg = 'An account with this email already exists.'
      throw new ApiError(msg, { email: msg })
    }
    if (/password/i.test(error.message)) throw new ApiError(error.message, { password: error.message })
    throw new ApiError(friendly(error.message))
  }
  // With "Confirm email" on, Supabase hides duplicate emails by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    const msg = 'An account with this email already exists.'
    throw new ApiError(msg, { email: msg })
  }
  if (!data.session || !data.user) return null
  return remember(data.user, true)
}

export async function login(form: FormData): Promise<User> {
  const { data, error } = await client().auth.signInWithPassword({
    email: text(form, 'email').toLowerCase(),
    password: String(form.get('password') ?? ''),
  })
  if (error) {
    if (/invalid login credentials/i.test(error.message)) throw new ApiError('Incorrect email or password.')
    if (/email not confirmed/i.test(error.message)) throw new ApiError('Confirm your email first — check your inbox for the link.')
    throw new ApiError(friendly(error.message))
  }
  return remember(data.user, true)
}

export async function logout() {
  localStorage.removeItem(USER_KEY)
  refreshed = null
  try {
    await supabase().auth.signOut()
  } catch {
    // not configured — nothing to sign out of
  }
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const { data } = await supabase().auth.getSession()
    return !!data.session
  } catch {
    return false
  }
}

export function getUser(): User | null {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null
    return u ? { ...u, role: asRole(u.role) } : null
  } catch {
    return null
  }
}

function friendly(msg: string) {
  return /fetch|network/i.test(msg) ? "Can't reach Supabase. Check your internet connection." : msg
}
