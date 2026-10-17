import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { describeError } from '@/lib/errors'
import { listInstitutions, type AdminInstitution } from '@/lib/hnt-admin'

// Una sola carga compartida entre la lista y el detalle: no hay endpoint
// para leer una institución suelta.
type State = { institutions: AdminInstitution[]; loading: boolean; error: string | null; loaded: boolean }

let state: State = { institutions: [], loading: false, error: null, loaded: false }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach(listener => listener())
}

export async function reloadInstitutions() {
  set({ loading: true, error: null })
  try {
    set({ institutions: await listInstitutions(), loading: false, loaded: true })
  } catch (error) {
    set({ loading: false, error: describeError(error, 'No pudimos cargar las instituciones. Inténtalo nuevamente.') })
  }
}

export function updateInstitution(id: string, patch: Partial<AdminInstitution>) {
  set({ institutions: state.institutions.map(item => (item.id === id ? { ...item, ...patch } : item)) })
}

export function useInstitutions() {
  const snapshot = useSyncExternalStore(
    useCallback((listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }, []),
    () => state,
  )
  useEffect(() => {
    if (!state.loaded && !state.loading) void reloadInstitutions()
  }, [])
  return snapshot
}
