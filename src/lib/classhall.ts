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

export type HallTaskSummary = HallTask & { submittedCount?: number }

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
}

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
