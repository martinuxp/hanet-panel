// Eventos falsos del modo demo.
import type { EventInput, HnEvent, ImportedEvent } from '@/lib/events'

const day = 86_400_000
const at = (days: number, hour: number) => new Date(new Date().setHours(hour, 0, 0, 0) + days * day).getTime()

function cover(text: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><text x="60" y="560" font-family="Inter,Arial" font-size="64" font-weight="700" fill="#fff">${text}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const base: Omit<HnEvent, 'id' | 'kind' | 'title' | 'startsAt'> = {
  status: 'published', category: 'other', description: '', imageUrl: null, gallery: [], endsAt: null, venueName: '', address: '',
  city: 'Temuco', region: 'Araucanía', priceFrom: null, isFree: false, ticketUrl: '', sourceName: '', sourceUrl: '', sponsored: false,
  perk: '', editorial: null, coupon: null, jornada: 'ambas', signupMode: 'none', capacity: null, authorName: 'Equipo HaNet', canEdit: true,
}

const NAMES = ['Agustina Bravo', 'Martín Cárdenas', 'Florencia Díaz', 'Vicente Espinoza', 'Isidora Fuentes', 'Joaquín Garrido', 'Antonia Henríquez', 'Benjamín Ibáñez', 'Catalina Jara', 'Lucas Lagos', 'Emilia Medina', 'Tomás Navarrete']
const COURSES = ['Segundo Medio K', 'Tercero Medio A', 'Cuarto Medio B', 'Primero Medio C']

const events: HnEvent[] = [
  { ...base, id: 'feria', kind: 'institution', title: 'Feria científica', category: 'academic', startsAt: at(5, 10), endsAt: at(5, 13), venueName: 'Gimnasio del liceo', description: 'Cada curso presenta su proyecto. Abierto a apoderados.', signupMode: 'list', capacity: 120, authorName: 'CEE LCH', imageUrl: cover('Feria científica', '#ef2274', '#832768'),
    signupCount: 12, signups: NAMES.map((name, index) => ({ name, courseId: COURSES[index % COURSES.length], createdAt: at(-index, 9) })) },
  { ...base, id: 'tocata', kind: 'institution', title: 'Tocata de primavera', category: 'music', startsAt: at(12, 18), venueName: 'Patio central', description: 'Bandas del liceo.', signupMode: 'count', signupCount: 64, authorName: 'CEE LCH', jornada: 'tarde' },
  { ...base, id: 'concierto', kind: 'regional', title: 'Concierto Sinfónico de Temuco', category: 'concert', startsAt: at(9, 20), venueName: 'Teatro Municipal de Temuco', address: 'Av. Pablo Neruda 01', priceFrom: 5000, ticketUrl: 'https://example.com', sourceName: 'Portal Tickets', imageUrl: cover('Concierto Sinfónico', '#4c5a6f', '#262d37') },
  { ...base, id: 'feria-libro', kind: 'regional', title: 'Feria del Libro de la Araucanía', category: 'exhibition', startsAt: at(15, 11), endsAt: at(18, 20), venueName: 'Plaza Aníbal Pinto', isFree: true },
]

let counter = 0

function notFound(): never {
  throw Object.assign(new Error('Ese evento ya no está disponible.'), { code: 'functions/not-found' })
}

export function eventsCall(name: string, input: Record<string, unknown>): unknown {
  switch (name) {
    case 'listEvents': {
      const kind = input.kind === 'institution' ? 'institution' : 'regional'
      return {
        events: events.filter(item => item.kind === kind).sort((a, b) => a.startsAt - b.startsAt).map(({ signups: _signups, ...item }) => ({ ...item })),
        canPublish: true,
        institutionName: kind === 'institution' ? 'LCH Temuco' : null,
      }
    }
    case 'getEvent':
      return { ...(events.find(item => item.id === input.id) ?? notFound()) }
    case 'saveEvent': {
      const data = input as unknown as EventInput
      const imageUrl = data.uploadPath?.startsWith('demo-cover:') ? data.uploadPath.slice('demo-cover:'.length) : undefined
      const existing = events.find(item => item.id === data.id)
      const { uploadPath: _path, galleryKeep: _keep, galleryUrls, ...fields } = data
      if (existing) {
        Object.assign(existing, fields, imageUrl ? { imageUrl } : {}, galleryUrls ? { gallery: galleryUrls } : {})
        return { id: existing.id }
      }
      const id = `evento-${++counter}`
      events.push({ ...base, ...fields, id, imageUrl: imageUrl ?? fields.imageUrl ?? null, gallery: galleryUrls ?? [], signupCount: 0, signups: [], authorName: 'Demo' } as HnEvent)
      return { id }
    }
    case 'deleteEvent': {
      const index = events.findIndex(item => item.id === input.id)
      if (index >= 0) events.splice(index, 1)
      return { ok: true }
    }
    case 'importEventFromUrl': {
      const draft: ImportedEvent = {
        title: 'Los Bunkers en Temuco', description: 'Gira 2026. Puertas abren 19:00.', imageUrl: cover('Los Bunkers', '#832768', '#262d37'), images: [],
        startsAt: at(21, 21), endsAt: null, venueName: 'Estadio Germán Becker', address: 'Av. Pablo Neruda 1200', city: 'Temuco', priceFrom: 18000,
        ticketUrl: String(input.url), sourceName: 'Portal Tickets', sourceUrl: String(input.url), typeLabel: 'Concierto', warnings: [], testOnly: false,
      }
      return draft
    }
    default:
      return undefined
  }
}
