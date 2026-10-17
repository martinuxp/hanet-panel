import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth } from '@/lib/firebase'

export type PanelRole = 'admin' | 'docente'

export type AuthState = {
  user: User | null
  role: PanelRole | null
  ready: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function readRole(value: unknown): PanelRole | null {
  return value === 'admin' || value === 'docente' ? value : null
}

// El rol viene de un custom claim `role` que asigna una Cloud Function.
// El cliente nunca lo decide.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'logout'>>({ user: null, role: null, ready: false })

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, ready: true })
        return
      }
      const token = await user.getIdTokenResult()
      setState({ user, role: readRole(token.claims.role), ready: true })
    })
  }, [])

  return <AuthContext.Provider value={{ ...state, logout: () => signOut(auth) }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
