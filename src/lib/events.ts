import { ref, uploadBytes } from 'firebase/storage'
import { call } from '@/lib/callable'
import { auth, storage } from '@/lib/firebase'

// Port de hanetcl/services/events-service.ts. Eventos de la ciudad (solo HNT)
// y del liceo (CEE, Admin y HNT), en functions/events.js.

export type EventKind = 'regional' | 'institution'
export type EventJornada = 'manana' | 'tarde' | 'ambas'
export type SignupMode = 'list' | 'count' | 'none'

export const EVENT_CATEGORIES = [
  { value: 'concert', label: 'Concierto' },
  { value: 'music', label: 'Música' },
  { value: 'exhibition', label: 'Exposición' },
  { value: 'theatre', label: 'Teatro' },
  { value: 'sports', label: 'Deporte' },
  { value: 'family', label: 'Familiar' },
  { value: 'academic', label: 'Académico' },
  { value: 'community', label: 'Comunidad' },
  { value: 'other', label: 'Otro' },
]

export const JORNADA_LABELS: Record<EventJornada, string> = { manana: 'Jornada mañana', tarde: 'Jornada tarde', ambas: 'Ambas jornadas' }

export const SIGNUP_LABELS: Record<SignupMode, string> = { none: 'Sin inscripción', count: 'Solo cuántos van', list: 'Con lista de inscritos' }

export type HnEvent = {
  id: string
  kind: EventKind
  status: 'published' | 'draft'
  title: string
  category: string
  description: string
  imageUrl: string | null
  gallery: string[]
  startsAt: number
  endsAt: number | null
  venueName: string
  address: string
  city: string
  region: string
  priceFrom: number | null
  isFree: boolean
  ticketUrl: string
  sourceName: string
  sourceUrl: string
  sponsored: boolean
  perk: string
  editorial: { subject: string; summary: string; sourceName: string; sourceUrl: string } | null
  coupon: { code: string; description: string } | null
  jornada: EventJornada
  signupMode: SignupMode
  capacity: number | null
  authorName: string
  signupCount?: number
  canEdit?: boolean
  /** Solo para quien organiza, cuando el evento lleva lista. */
  signups?: { name: string; courseId: string; createdAt: number | null }[]
  checkins?: { name: string; courseId: string; at: number | null }[]
}

export type EventInput = Partial<Omit<HnEvent, 'id' | 'gallery' | 'signups' | 'checkins'>> & {
  id?: string
  kind: EventKind
  title: string
  startsAt: number
  uploadPath?: string
  galleryKeep?: string[]
  galleryUrls?: string[]
}

export type ImportedEvent = {
  title: string
  description: string
  imageUrl: string
  images: string[]
  startsAt: number | null
  endsAt: number | null
  venueName: string
  address: string
  city: string
  priceFrom: number | null
  ticketUrl: string
  sourceName: string
  sourceUrl: string
  typeLabel: string
  warnings: string[]
  testOnly: boolean
}

export const listEvents = (kind: EventKind) =>
  call<{ kind: EventKind }, { events: HnEvent[]; canPublish: boolean; institutionName: string | null }>('listEvents')({ kind })

export const getEvent = (id: string) => call<{ id: string }, HnEvent>('getEvent')({ id })

export async function saveEvent(input: EventInput) {
  return (await call<EventInput, { id: string }>('saveEvent')(input)).id
}

export const deleteEvent = (id: string) => call('deleteEvent')({ id })

export const importEventFromUrl = (url: string) => call<{ url: string }, ImportedEvent>('importEventFromUrl')({ url })

/** La categoría de HaNet que corresponde al tipo de evento de la página importada. */
export function categoryFromType(typeLabel: string) {
  const type = typeLabel.toLocaleLowerCase('es')
  return /concierto/.test(type) ? 'concert' : /m[uú]sica/.test(type) ? 'music' : /teatro|danza|comedia|humor/.test(type) ? 'theatre'
    : /deporte/.test(type) ? 'sports' : /familia|infantil/.test(type) ? 'family' : /exposici|arte|museo/.test(type) ? 'exhibition' : null
}

export const MAX_COVER_BYTES = 5 * 1024 * 1024

/** Sube la portada a la carpeta de quien publica; saveEvent la mueve al evento. */
export async function stageCover(file: File) {
  if (import.meta.env.VITE_DEMO === '1') return `demo-cover:${URL.createObjectURL(file)}`
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Inicia sesión para subir la portada.')
  const path = `events-uploads/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await uploadBytes(ref(storage, path), file, { contentType: file.type })
  return path
}

const dateFormat = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export function eventDate(ms: number) {
  return dateFormat.format(ms)
}

/** Arma un CSV que Excel abre bien en español: separado por punto y coma y con BOM. */
export function downloadCsv(fileName: string, rows: string[][]) {
  const escape = (value: string) => (/[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)
  const text = `﻿${rows.map(row => row.map(escape).join(';')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
