import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEMO } from '@/lib/demo'
import { auth } from '@/lib/firebase'

// Roles de HaNet que entran al panel (los mismos de functions/members.js).
// `Estudiante` no tiene acceso.
export type PanelRole = 'HNT' | 'Admin' | 'Profesor' | 'Directiva' | 'CEE'

export const PANEL_ROLES: PanelRole[] = ['HNT', 'Admin', 'Profesor', 'Directiva', 'CEE']

/** Lo que el panel usa de la cuenta. En producción es el `User` de Firebase. */
export type PanelUser = Pick<User, 'uid' | 'email' | 'displayName'>

export type AuthState = {
  user: PanelUser | null
  role: PanelRole | null
  courseId: string | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  /** Solo en la demo: entrar con un rol sin cuenta. */
  loginAs?: (role: PanelRole) => void
  logout: () => Promise<void>
}

type Session = Pick<AuthState, 'user' | 'role' | 'courseId' | 'ready'>

const AuthContext = createContext<AuthState | null>(null)

function readRole(value: unknown): PanelRole | null {
  return PANEL_ROLES.includes(value as PanelRole) ? (value as PanelRole) : null
}

const signedOut: Session = { user: null, role: null, courseId: null, ready: true }

// Rol y curso vienen de los claims `role` y `courseId`, que sincroniza la
// función syncMyClaims del backend. El cliente nunca los decide.
function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Session>({ ...signedOut, ready: false })

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState(signedOut)
        return
      }
      const token = await user.getIdTokenResult()
      const courseId = typeof token.claims.courseId === 'string' ? token.claims.courseId : null
      setState({ user, role: readRole(token.claims.role), courseId, ready: true })
    })
  }, [])

  const value: AuthState = {
    ...state,
    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    logout: () => signOut(auth),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const DEMO_NAMES: Record<PanelRole, string> = {
  HNT: 'Camila Rojas',
  Admin: 'Rodrigo Álvarez',
  Profesor: 'Paula Sepúlveda',
  Directiva: 'Valentina Muñoz',
  CEE: 'Josefa Navarro',
}

function demoSession(role: PanelRole): Session {
  const displayName = DEMO_NAMES[role]
  const email = `${displayName.split(' ')[0].toLowerCase()}@demo.hanet.cl`
  const courseId = role === 'HNT' || role === 'Admin' ? null : 'Segundo Medio K'
  return { user: { uid: `demo-${role}`, email, displayName }, role, courseId, ready: true }
}

function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Session>(() => demoSession('HNT'))
  const value: AuthState = {
    ...state,
    login: async () => setState(demoSession('HNT')),
    loginAs: role => setState(demoSession(role)),
    logout: async () => setState(signedOut),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const AuthProvider = DEMO ? DemoAuthProvider : FirebaseAuthProvider

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
