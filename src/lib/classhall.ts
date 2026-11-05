import { call } from '@/lib/callable'
import biology from '@/assets/hall-themes/Biology.jpg'
import english from '@/assets/hall-themes/English.jpg'
import geography from '@/assets/hall-themes/Geography.jpg'
import geometry from '@/assets/hall-themes/Geometry.jpg'
import languageArts from '@/assets/hall-themes/LanguageArts.jpg'
import math from '@/assets/hall-themes/Math.jpg'
import physics from '@/assets/hall-themes/Physics.jpg'
import socialStudies from '@/assets/hall-themes/SocialStudies.jpg'
import writing from '@/assets/hall-themes/Writing.jpg'
import backToSchool from '@/assets/hall-themes/backtoschool.jpg'
import gameNight from '@/assets/hall-themes/gamenight.jpg'
import hobby from '@/assets/hall-themes/hobby.jpg'
import read from '@/assets/hall-themes/read.jpg'
import sailing from '@/assets/hall-themes/sailing.jpg'

// Port de hanetcl/services/classhall-service.ts, solo lo que usa el área
// Docente. functions/classhall.js deja crear Halls a Profesor, Admin y HNT, y
// solo el docente que hizo el Hall publica tareas y revisa entregas.

export type HallPlan = 'comun' | 'electivo' | 'dominio'

export const PLAN_LABELS: Record<HallPlan, string> = {
  comun: 'Plan común',
  electivo: 'Electivo',
  dominio: 'Dominio',
}

export type Hall = {
  id: string
  subject: string
  courseId: string
  teacherName: string
  theme: string
  plan: HallPlan
  isTeacher: boolean
  /** Solo lo recibe quien hace el Hall. */
  code: string | null
  memberCount: number | null
  nextEvaluation?: { title: string; date: number } | null
  /** Si la institución tiene el módulo Notas (solo en getHall). */
  gradesOn?: boolean
}

export type HallAnnouncement = { id: string; body: string; authorName: string; createdAt: number | null; updatedAt: number | null }

export type HallEvaluation = {
  id: string
  title: string
  date: number
  exigency: number | null
  skills: string[]
  contents: { name: string; detail: string; points: number[] }[]
  objectives: { code: string; text: string }[]
  prep: string
  authorName: string
  updatedAt: number | null
  /** Solo para el docente y Admin, cuando la institución tiene el módulo Notas. */
  gradesCount?: number
  gradesPublishedAt?: number | null
}

export type HallDocumentKind = 'pdf' | 'word' | 'powerpoint' | 'excel' | 'image' | 'file'

export type HallDocument = {
  id: string
  name: string
  kind: HallDocumentKind
  size: number
  url: string
  authorName: string
  announcementId: string | null
  evaluationId: string | null
  taskId?: string | null
  createdAt: number | null
}

export type HallTask = {
  id: string
  title: string
  instructions: string
  dueAt: number
  /** Sigue recibiendo entregas después del plazo, marcadas como atrasadas. */
  acceptLate: boolean
  authorName: string
  createdAt: number | null
  updatedAt: number | null
}

export type HallTaskSummary = HallTask & {
  submittedCount?: number
  /** Entregas que el docente todavía no revisa. */
  pendingReviewCount?: number
}

export type SubmissionItem =
  | { id: string; kind: 'link'; name: string; url: string }
  | { id: string; kind: 'file'; name: string; fileKind: HallDocumentKind; size: number; url: string }

export type HallSubmission = {
  uid: string
  studentName: string
  courseId: string
  items: SubmissionItem[]
  note: string
  submittedAt: number | null
  late: boolean
  reviewed: boolean
  /** El comentario del docente. Solo lo ve ese estudiante. */
  feedback: string
  reviewedAt: number | null
}

export type HallDetail = {
  hall: Hall
  announcements: HallAnnouncement[]
  evaluations: HallEvaluation[]
  documents?: HallDocument[]
  tasks?: HallTaskSummary[]
  expectedSubmissions?: number | null
}

export type HallTaskDetail = {
  task: HallTask
  attachment: HallDocument | null
  subject: string
  isTeacher: boolean
  submissions?: HallSubmission[]
  expectedSubmissions?: number
  /** Quienes no han entregado. Solo lo recibe el docente del Hall. */
  missing?: { uid: string; name: string; courseId: string }[]
}

export type HallEvaluationInput = {
  hallId: string
  evaluationId?: string
  title: string
  date: number
  exigency: number | null
  skills: string[]
  contents: { name: string; detail: string; points: number[] }[]
  objectives: { code: string; text: string }[]
  prep: string
}

/** Borrador que devuelve scanSpecTable a partir de una T.E. en PDF, Word o foto. */
export type SpecTableDraft = {
  title: string
  /** "2026-11-12" o null si no la encontró. */
  date: string | null
  exigency: number | null
  objectives: { code: string; text: string }[]
  skills: string[]
  contents: { name: string; detail: string; points: number[] }[]
  prep: string
  warnings: string[]
}

/** Lo que se adjunta a un archivo al moverlo al Hall. Sin nada, es material suelto. */
export type DocumentAttach = { announcementId?: string; evaluationId?: string; taskId?: string }

export type HallTaskInput = {
  hallId: string
  taskId?: string
  title: string
  instructions: string
  dueAt: number
  acceptLate: boolean
}

export const listMyHalls = () => call<void, { halls: Hall[]; canCreate: boolean }>('listMyHalls')(undefined)

export const getHall = (hallId: string) => call<{ hallId: string }, HallDetail>('getHall')({ hallId })

export const getHallTask = (hallId: string, taskId: string) =>
  call<{ hallId: string; taskId: string }, HallTaskDetail>('getHallTask')({ hallId, taskId })

export async function saveHallTask(input: HallTaskInput) {
  return (await call<HallTaskInput, { taskId: string }>('saveHallTask')(input)).taskId
}

export const deleteHallTask = (hallId: string, taskId: string) => call('deleteHallTask')({ hallId, taskId })

/** Mueve un archivo ya subido a la carpeta del docente (uploads.ts) al Hall. */
export const attachHallDocument = (hallId: string, uploadPath: string, name: string, attach: DocumentAttach = {}) =>
  call<object, HallDocument>('attachHallDocument')({ hallId, uploadPath, name, ...attach })

export const deleteHallDocument = (hallId: string, documentId: string) => call('deleteHallDocument')({ hallId, documentId })

export async function saveHallAnnouncement(hallId: string, body: string, announcementId?: string) {
  return (await call<object, { announcementId: string }>('saveHallAnnouncement')({ hallId, body, announcementId })).announcementId
}

export const deleteHallAnnouncement = (hallId: string, announcementId: string) =>
  call('deleteHallAnnouncement')({ hallId, announcementId })

export async function saveHallEvaluation(input: HallEvaluationInput) {
  return (await call<HallEvaluationInput, { evaluationId: string }>('saveHallEvaluation')(input)).evaluationId
}

export const deleteHallEvaluation = (hallId: string, evaluationId: string) =>
  call('deleteHallEvaluation')({ hallId, evaluationId })

/** Lee una T.E. ya subida (PDF, Word o foto). El archivo sigue en la carpeta del docente. */
export const scanSpecTable = (hallId: string, uploadPath: string) =>
  call<object, SpecTableDraft>('scanSpecTable')({ hallId, uploadPath })

export const reviewHallSubmission = (hallId: string, taskId: string, studentUid: string, reviewed: boolean, feedback: string) =>
  call<object, HallSubmission>('reviewHallSubmission')({ hallId, taskId, studentUid, reviewed, feedback })

const THEMES: Record<string, string> = {
  math, geometry, physics, biology, english, languageArts, writing, socialStudies, geography,
  read, backToSchool, hobby, gameNight, sailing,
}

export function hallThemeImage(theme: string) {
  return THEMES[theme] ?? backToSchool
}

export const DOCUMENT_LABELS: Record<HallDocumentKind, string> = {
  pdf: 'PDF',
  word: 'Word',
  powerpoint: 'PowerPoint',
  excel: 'Excel',
  image: 'Imagen',
  file: 'Archivo',
}

export function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`
}

const dayFormat = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** "mié 12 nov, 23:59" */
export function shortDateTime(ms: number) {
  return `${dayFormat.format(ms)}, ${timeFormat.format(ms)}`
}

/** "mié 12 nov" */
export function shortDate(ms: number) {
  return dayFormat.format(ms)
}
