import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

/**
 * Una Cloud Function de HaNet. El panel nunca escribe en Firestore: todo pasa
 * por estas funciones, que revisan el rol de quien llama.
 */
export function call<Req, Res>(name: string) {
  return async (data: Req): Promise<Res> => {
    // Comparación literal para que el build normal elimine la demo entera.
    if (import.meta.env.VITE_DEMO === '1') return (await import('@/demo/backend')).demoCall(name, data) as Promise<Res>
    return (await httpsCallable<Req, Res>(functions, name)(data)).data
  }
}
