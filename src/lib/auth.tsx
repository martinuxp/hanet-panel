import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth } from '@/lib/firebase'

// Roles de HaNet que entran al panel (los mismos de functions/members.js).
// `Estudiante` no tiene acceso.
export type PanelRole = 'HNT' | 'Admin' | 'Profesor' | 'Directiva' | 'CEE'

const PANEL_ROLES: PanelRole[] = ['HNT', 'Admin', 'Profesor', 'Directiva', 'CEE']

export type AuthState = {
  user: User | null
  role: PanelRole | null
  courseId: string | null
  ready: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function readRole(value: unknown): PanelRole | null {
  return PANEL_ROLES.includes(value as PanelRole) ? (value as PanelRole) : null
}

// Rol y curso vienen de los claims `role` y `courseId`, que sincroniza la
// función syncMyClaims del backend. El cliente nunca los decide.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'logout'>>({ user: null, role: null, courseId: null, ready: false })

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, courseId: null, ready: true })
        return
      }
      const token = await user.getIdTokenResult()
      const courseId = typeof token.claims.courseId === 'string' ? token.claims.courseId : null
      setState({ user, role: readRole(token.claims.role), courseId, ready: true })
    })
  }, [])

  return <AuthContext.Provider value={{ ...state, logout: () => signOut(auth) }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
