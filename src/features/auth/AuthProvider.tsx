import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { FirebaseError } from 'firebase/app'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import type { User } from '@/types'
import { auth, db } from '@/config/firebase'
import { userFromDoc, type UserDoc } from '@/firebase/model'

/*
 * Sign-in with Firebase Authentication (email and password). The role and the account status are not part
 * of the Firebase account: they are in users/{uid}, which the security rules read too. A new account gets
 * that document as an active contributor; only an admin changes it afterwards.
 * "Remember me" keeps the session in local storage, otherwise it ends with the browser tab.
 */

export type LoginResult = { ok: true; user: User } | { ok: false; error: 'invalid' | 'disabled' | 'network' | 'rate-limited' }

export interface AuthValue {
  user: User | null
  /** True until Firebase has said whether a session is open. */
  restoring: boolean
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: 'exists' | 'invalid' | 'network' }>
  logout: () => void
  /** Sends Firebase's password reset email. */
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: 'network' | 'invalid' }>
  /** Updates the signed-in user shown in the app (the profile page writes it to users/{uid} through useData). */
  updateUser: (patch: Partial<Pick<User, 'name' | 'email' | 'organization'>>) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValue | null>(null)

/** While an account is being created, register() writes its profile; the listener must not race it. */
let registering = false

/** Reads users/{uid}, creating it for an account that has none yet (new sign-up, or made in the console). */
async function loadProfile(fb: FirebaseUser, name?: string): Promise<User> {
  const ref = doc(db, 'users', fb.uid)
  const snap = await getDoc(ref)
  const now = new Date().toISOString()
  if (!snap.exists()) {
    const fresh: UserDoc = {
      name: name?.trim() || fb.displayName || (fb.email ?? '').split('@')[0],
      email: fb.email ?? '',
      role: 'contributor',
      active: true,
      createdAt: now,
      lastActiveAt: now,
    }
    await setDoc(ref, fresh)
    return userFromDoc(fb.uid, fresh)
  }
  const data = snap.data() as UserDoc
  if (data.active) void updateDoc(ref, { lastActiveAt: now }).catch(() => undefined)
  return userFromDoc(fb.uid, { ...data, lastActiveAt: now })
}

const code = (error: unknown) => (error instanceof FirebaseError ? error.code : '')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [restoring, setRestoring] = useState(true)

  useEffect(
    () =>
      onAuthStateChanged(auth, (fb) => {
        if (registering) return
        if (!fb) {
          setUser(null)
          setRestoring(false)
          return
        }
        loadProfile(fb)
          .then((u) => {
            if (!u.active) {
              setUser(null)
              void signOut(auth)
            } else setUser(u)
          })
          .catch(() => setUser(null))
          .finally(() => setRestoring(false))
      }),
    [],
  )

  const logout = useCallback(() => {
    void signOut(auth)
    setUser(null)
  }, [])

  const login = useCallback<AuthValue['login']>(async (email, password, remember) => {
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const u = await loadProfile(cred.user)
      if (!u.active) {
        await signOut(auth)
        return { ok: false, error: 'disabled' }
      }
      setUser(u)
      return { ok: true, user: u }
    } catch (error) {
      const c = code(error)
      if (c === 'auth/too-many-requests') return { ok: false, error: 'rate-limited' }
      if (c === 'auth/user-disabled') return { ok: false, error: 'disabled' }
      if (c === 'auth/network-request-failed') return { ok: false, error: 'network' }
      return { ok: false, error: 'invalid' }
    }
  }, [])

  const register = useCallback<AuthValue['register']>(async (name, email, password) => {
    registering = true
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      await updateProfile(cred.user, { displayName: name.trim() })
      await loadProfile(cred.user, name)
      // The register page asks the user to sign in, as before.
      await signOut(auth)
      return { ok: true }
    } catch (error) {
      const c = code(error)
      if (c === 'auth/email-already-in-use') return { ok: false, error: 'exists' }
      if (c === 'auth/network-request-failed') return { ok: false, error: 'network' }
      return { ok: false, error: 'invalid' }
    } finally {
      registering = false
    }
  }, [])

  const resetPassword = useCallback<AuthValue['resetPassword']>(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase())
      return { ok: true }
    } catch (error) {
      const c = code(error)
      // An unknown address is not reported, so the page does not reveal which emails have accounts.
      if (c === 'auth/user-not-found') return { ok: true }
      if (c === 'auth/network-request-failed') return { ok: false, error: 'network' }
      return { ok: false, error: 'invalid' }
    }
  }, [])

  const updateUser = useCallback<AuthValue['updateUser']>((patch) => {
    setUser((u) => (u ? { ...u, ...patch, email: u.email } : u))
  }, [])

  const value = useMemo(
    () => ({ user, restoring, login, register, logout, resetPassword, updateUser }),
    [user, restoring, login, register, logout, resetPassword, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
