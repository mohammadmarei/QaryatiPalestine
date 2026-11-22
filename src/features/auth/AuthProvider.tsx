import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { api, ApiError, setAccessToken, setUnauthorizedHandler } from '@/api/client'
import { userFromApi } from '@/api/mappers'
import type { ApiLoginResponse, ApiUser } from '@/api/types'
import { storage } from '@/utils/storage'

/*
 * Sign-in against the API (POST /auth/login, JWT). The access token is kept in memory, and in
 * localStorage only when "remember me" is ticked. GET /auth/me checks a remembered token on start-up.
 * A 401 on any signed-in request (expired token) signs the user out.
 */

const SESSION_KEY = 'qaryati.session.v2'

interface StoredSession {
  token: string
  user: User
}


export type LoginResult = { ok: true; user: User } | { ok: false; error: 'invalid' | 'disabled' | 'network' | 'rate-limited' }

export interface AuthValue {
  user: User | null
  /** True while a remembered session is being checked on start-up. */
  restoring: boolean
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: 'exists' | 'invalid' | 'network' }>
  logout: () => void
  /** Name and organisation shown in this browser; the API has no endpoint for editing one's own profile. */
  updateUser: (patch: Partial<Pick<User, 'name' | 'email' | 'organization'>>) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValue | null>(null)

function loginError(error: unknown): LoginResult {
  if (error instanceof ApiError) {
    if (error.status === 429) return { ok: false, error: 'rate-limited' }
    if (error.status === 403) return { ok: false, error: 'disabled' }
    if (error.status === 0) return { ok: false, error: 'network' }
  }
  return { ok: false, error: 'invalid' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read the remembered session once, and give the client its token before the first request.
  const [stored] = useState(() => {
    const session = storage.getJSON<StoredSession | null>(SESSION_KEY, null)
    if (session) setAccessToken(session.token)
    return session
  })
  const [user, setUser] = useState<User | null>(stored?.user ?? null)
  const [restoring, setRestoring] = useState(Boolean(stored))
  const [remember, setRemember] = useState(Boolean(stored))

  const logout = useCallback(() => {
    setAccessToken(null)
    storage.remove(SESSION_KEY)
    setUser(null)
  }, [])

  // Confirm a remembered token with the API.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!stored) return
    api<ApiUser>('/auth/me')
      .then((me) => {
        const fresh = { ...stored.user, ...userFromApi(me), organization: stored.user.organization }
        setUser(fresh)
        storage.setJSON(SESSION_KEY, { token: stored.token, user: fresh })
      })
      .catch((error) => {
        // Keep the session when the server is only unreachable; drop it when the token is refused.
        if (!(error instanceof ApiError) || error.status !== 0) logout()
      })
      .finally(() => setRestoring(false))
    return () => setUnauthorizedHandler(null)
    // Runs once on start-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback<AuthValue['login']>(async (email, password, keep) => {
    try {
      const res = await api<ApiLoginResponse>('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } })
      const u = userFromApi(res.user)
      setAccessToken(res.accessToken)
      setUser(u)
      setRemember(keep)
      if (keep) storage.setJSON(SESSION_KEY, { token: res.accessToken, user: u })
      else storage.remove(SESSION_KEY)
      return { ok: true, user: u }
    } catch (error) {
      return loginError(error)
    }
  }, [])

  const register = useCallback<AuthValue['register']>(async (name, email, password) => {
    try {
      await api<ApiLoginResponse>('/auth/register', { method: 'POST', body: { fullName: name.trim(), email: email.trim().toLowerCase(), password } })
      return { ok: true }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return { ok: false, error: 'exists' }
      if (error instanceof ApiError && error.status === 0) return { ok: false, error: 'network' }
      return { ok: false, error: 'invalid' }
    }
  }, [])

  const updateUser = useCallback<AuthValue['updateUser']>(
    (patch) => {
      setUser((u) => {
        if (!u) return u
        const next = { ...u, ...patch }
        const session = storage.getJSON<StoredSession | null>(SESSION_KEY, null)
        if (remember && session) storage.setJSON(SESSION_KEY, { ...session, user: next })
        return next
      })
    },
    [remember],
  )

  const value = useMemo(
    () => ({ user, restoring, login, register, logout, updateUser }),
    [user, restoring, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
