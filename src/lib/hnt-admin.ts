import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { call } from '@/lib/callable'
import { storage } from '@/lib/firebase'

// Port de hanetcl/services/hnt-admin-service.ts. Todo pasa por las funciones
// admin* del backend, que exigen el claim HNT en cada llamada.

export type AdminInstitution = {
  id: string
  name: string
  fullName: string
  rosterCount: number
  hasInviteCode: boolean
  inviteUpdatedAt: number | null
  logoUrl: string | null
  bannerUrl: string | null
  /** Módulos prendidos. Null: la institución todavía no tiene lista, así que todos están prendidos. */
  modules?: ModuleId[] | null
}

/** Módulos que se pueden apagar por institución (setInstitutionModules en hanetcl). */
export const MODULES = [
  { id: 'feed', name: 'Feed y Comunidad', description: 'Publicaciones del liceo, el CEE y las directivas, con reacciones.' },
  { id: 'polls', name: 'Encuestas', description: 'Encuestas anónimas dentro del Feed. Necesita el Feed prendido.' },
  { id: 'alliances', name: 'Aniversario', description: 'Alianzas, actividades, puntajes y la semana del aniversario en el inicio.' },
  { id: 'electividad', name: 'Electividad', description: 'Test de intereses para elegir electivos, en Herramientas.' },
] as const

export type ModuleId = (typeof MODULES)[number]['id']

export type RosterRow = {
  rut: string
  nombres: string
  apellidos: string
  curso: string
  email: string
}

export type RosterImportResult = {
  imported: number
  rejected: { row: number; reason: string }[]
  rejectedCount: number
}

export const MEMBER_ROLES = ['Estudiante', 'Directiva', 'CEE', 'Profesor', 'Admin', 'HNT'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export type Member = {
  rut: string
  fullName: string
  curso: string
  email: string
  /** Null mientras la persona no vincula su HaNet ID. */
  uid: string | null
  role: MemberRole | null
  /** Bloqueada por romper los términos: no puede entrar a HaNet. */
  blocked?: boolean
}


export async function listInstitutions() {
  return (await call<void, { institutions: AdminInstitution[] }>('adminListInstitutions')(undefined)).institutions
}

export async function createInstitution(name: string, fullName: string) {
  return (await call<{ name: string; fullName: string }, { id: string }>('adminCreateInstitution')({ name, fullName })).id
}

/** Devuelve la frase nueva. El backend guarda solo su hash: es la única vez que se puede leer. */
export async function rotateInviteCode(institutionId: string) {
  return (await call<{ institutionId: string }, { words: string[] }>('adminRotateInviteCode')({ institutionId })).words
}

export async function setInstitutionModules(institutionId: string, modules: ModuleId[]) {
  return (await call<{ institutionId: string; modules: ModuleId[] }, { modules: ModuleId[] }>('setInstitutionModules')({ institutionId, modules })).modules
}

export type BrandingKind = 'logo' | 'banner'

// El escudo conserva su transparencia (PNG); el banner es una foto (JPEG). Igual que la app.
const BRANDING_FILES: Record<BrandingKind, { file: string; width: number; type: string; quality?: number }> = {
  logo: { file: 'logo.png', width: 512, type: 'image/png' },
  banner: { file: 'banner.jpg', width: 1600, type: 'image/jpeg', quality: 0.82 },
}

/** Achica la imagen en el navegador antes de subirla. */
async function resizeImage(file: File, width: number, type: string, quality?: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, width / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Este navegador no puede preparar la imagen.')
  if (type === 'image/jpeg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('No pudimos preparar la imagen.'))), type, quality))
}

/** Achica, sube y guarda la imagen; devuelve su URL pública. */
export async function uploadBrandingImage(institutionId: string, kind: BrandingKind, file: File) {
  const spec = BRANDING_FILES[kind]
  if (import.meta.env.VITE_DEMO === '1') {
    const url = URL.createObjectURL(file)
    await call('adminSetInstitutionBranding')({ institutionId, kind, url })
    return url
  }
  const blob = await resizeImage(file, spec.width, spec.type, spec.quality)
  const fileRef = ref(storage, `institutions/${institutionId}/${spec.file}`)
  await uploadBytes(fileRef, blob, { contentType: spec.type, cacheControl: 'public, max-age=86400' })
  const url = await getDownloadURL(fileRef)
  await call('adminSetInstitutionBranding')({ institutionId, kind, url })
  return url
}

export async function removeBrandingImage(institutionId: string, kind: BrandingKind) {
  await call('adminSetInstitutionBranding')({ institutionId, kind, url: null })
  if (import.meta.env.VITE_DEMO === '1') return
  try {
    await deleteObject(ref(storage, `institutions/${institutionId}/${BRANDING_FILES[kind].file}`))
  } catch (error) {
    if ((error as { code?: string }).code !== 'storage/object-not-found') throw error
  }
}

export function importRoster(institutionId: string, rows: RosterRow[]) {
  return call<{ institutionId: string; rows: RosterRow[] }, RosterImportResult>('adminImportRoster')({ institutionId, rows })
}

export function listMembers(institutionId: string) {
  return call<{ institutionId: string }, { members: Member[]; truncated: boolean }>('adminListMembers')({ institutionId })
}

export async function setMemberRole(uid: string, role: MemberRole) {
  await call('adminSetRole')({ uid, role })
}

export async function setMemberBlocked(uid: string, blocked: boolean) {
  await call('adminSetBlocked')({ uid, blocked })
}

export async function unlinkMember(uid: string) {
  await call('adminUnlinkMember')({ uid })
}

/**
 * Lee una nómina pegada desde una planilla: una persona por línea, columnas
 * RUT, nombres, apellidos, curso, correo. `headerRows` dice cuántas líneas
 * iniciales se saltaron, para reportar errores con los números de la planilla.
 */
export function parseRoster(text: string): { rows: RosterRow[]; headerRows: number } {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return { rows: [], headerRows: 0 }

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const table = lines.map(line => line.split(delimiter).map(cell => cell.trim()))
  // Una primera fila cuya columna RUT no tiene dígitos es el encabezado.
  const headerRows = /\d/.test(table[0][0] ?? '') ? 0 : 1

  const rows = table.slice(headerRows).map(cells => ({
    rut: cells[0] ?? '',
    nombres: cells[1] ?? '',
    apellidos: cells[2] ?? '',
    curso: cells[3] ?? '',
    email: cells[4] ?? '',
  }))
  return { rows, headerRows }
}

export function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString('es-CL')} ${count === 1 ? one : many}`
}
