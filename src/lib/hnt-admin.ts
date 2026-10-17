import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

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
}

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

function call<Req, Res>(name: string) {
  return async (data: Req) => (await httpsCallable<Req, Res>(functions, name)(data)).data
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
