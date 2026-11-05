import { call } from '@/lib/callable'

// Módulo Notas (hanetcl, functions de notas): una nota por estudiante colgada
// de una evaluación de ClassHall. El docente las carga en borrador y las
// publica; al publicarlas, cada estudiante recibe un aviso sin la nota y la
// raspa en la app. El liceo sigue llevando el libro de clases oficial.

export type GradeStatus = 'draft' | 'published'

export type GradeStudent = {
  uid: string
  name: string
  courseId: string | null
  grade: number | null
  status: GradeStatus | null
  seen: boolean
}

export type EvaluationGrades = {
  evaluation: { id: string; title: string; date: number; weight: number | null; published: boolean; publishedAt: number | null }
  students: GradeStudent[]
  /** Estudiantes de la nómina del curso que todavía no tienen cuenta (solo plan común). */
  withoutAccount: number
}

export const getEvaluationGrades = (hallId: string, evaluationId: string) =>
  call<{ hallId: string; evaluationId: string }, EvaluationGrades>('getEvaluationGrades')({ hallId, evaluationId })

/** Hasta 200 notas por llamada. `grade: null` borra la nota. */
export const MAX_GRADES_PER_CALL = 200

export async function saveEvaluationGrades(hallId: string, evaluationId: string, grades: { uid: string; grade: number | null }[], weight?: number | null) {
  let saved = 0
  let removed = 0
  for (let start = 0; start < Math.max(grades.length, 1); start += MAX_GRADES_PER_CALL) {
    const result = await call<unknown, { saved: number; removed: number }>('saveEvaluationGrades')({
      hallId, evaluationId, grades: grades.slice(start, start + MAX_GRADES_PER_CALL),
      // La ponderación va una sola vez, con el primer lote.
      ...(start === 0 && weight !== undefined ? { weight } : {}),
    })
    saved += result.saved
    removed += result.removed
  }
  return { saved, removed }
}

export const publishEvaluationGrades = (hallId: string, evaluationId: string) =>
  call<{ hallId: string; evaluationId: string }, { published: number }>('publishEvaluationGrades')({ hallId, evaluationId })

/** Nota chilena, de 1,0 a 7,0 con un decimal. */
export const PASSING_GRADE = 4

/**
 * Lee una nota como la escribe un docente: "6,2", "6.2", "6" o "62" (lo que
 * queda en las planillas sin la coma). Devuelve null si está vacía y
 * 'invalid' si no es una nota.
 */
export function parseGrade(raw: string): number | null | 'invalid' {
  const text = raw.trim().replace(',', '.')
  if (!text) return null
  if (!/^\d{1,2}(\.\d+)?$/.test(text)) return 'invalid'
  let value = Number(text)
  if (/^\d{2}$/.test(text)) value = value / 10
  if (!/^\d+(\.\d)?$/.test(String(value))) return 'invalid'
  if (value < 1 || value > 7) return 'invalid'
  return value
}

export const formatGrade = (grade: number) => grade.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Promedio con un decimal, redondeado hacia arriba desde ,05 como en el liceo. */
export function average(grades: number[]) {
  if (grades.length === 0) return null
  const mean = grades.reduce((sum, grade) => sum + grade, 0) / grades.length
  return Math.round(mean * 10 + 1e-9) / 10
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ ]/g, ' ').replace(/\s+/g, ' ').trim()

export type PasteMatch = { uid: string; grade: number }
export type PasteResult = {
  matches: PasteMatch[]
  /** Líneas que no se pudieron usar, con su número en lo pegado. */
  problems: { line: number; text: string; reason: string }[]
  mode: 'names' | 'order'
}

/**
 * Lee notas pegadas desde Excel, Sheets o un CSV. Dos formas:
 * - Nombre y nota en cada fila (en cualquier orden de columnas): se busca a
 *   cada estudiante por su nombre, sin tildes ni mayúsculas.
 * - Solo una columna de notas: se asignan en el orden de la lista.
 */
export function parsePastedGrades(text: string, students: { uid: string; name: string }[]): PasteResult {
  // Las celdas vacías de una columna llegan como líneas vacías: en el modo
  // "en orden" cuentan como un estudiante sin nota, así que no se botan.
  const all = text.split(/\r?\n/).map((line, index) => ({ line: index + 1, text: line.trim() }))
  while (all.length && !all[all.length - 1].text) all.pop()
  while (all.length && !all[0].text) all.shift()
  const lines = all
  if (lines.length === 0) return { matches: [], problems: [], mode: 'order' }
  const delimiter = lines.some(item => item.text.includes('\t')) ? '\t' : lines.some(item => item.text.includes(';')) ? ';' : null
  const rows = lines.map(item => ({ ...item, cells: delimiter ? item.text.split(delimiter).map(cell => cell.trim()) : [item.text] }))
  const hasNames = rows.some(row => row.cells.some(cell => /[a-záéíóúñ]{2}/i.test(cell)))

  const problems: PasteResult['problems'] = []
  const matches: PasteMatch[] = []

  if (!hasNames) {
    if (rows.length > students.length) problems.push({ line: rows[students.length].line, text: rows[students.length].text, reason: `Hay más notas (${rows.length}) que estudiantes (${students.length}).` })
    rows.slice(0, students.length).forEach((row, index) => {
      // Una celda vacía no borra la nota que ya estaba.
      if (!row.text) return
      const grade = parseGrade(row.cells.at(-1) ?? '')
      if (grade === 'invalid') problems.push({ line: row.line, text: row.text, reason: 'No es una nota entre 1,0 y 7,0.' })
      else if (grade != null) matches.push({ uid: students[index].uid, grade })
    })
    return { matches, problems, mode: 'order' }
  }

  const byName = students.map(student => ({ uid: student.uid, words: normalize(student.name).split(' ') }))
  const used = new Set<string>()
  for (const row of rows) {
    const isName = (cell: string) => /[a-záéíóúñ]{2}/i.test(cell)
    const nameCells = row.cells.filter(isName)
    if (nameCells.length === 0) continue
    // La nota va después del nombre; lo de antes (el N° de lista) no cuenta.
    const lastName = row.cells.findLastIndex(isName)
    const gradeCell = row.cells.slice(lastName + 1).reverse().find(cell => cell.trim())
    const words = normalize(nameCells.join(' ')).split(' ').filter(Boolean)
    // El estudiante cuyo nombre tiene todas las palabras de la fila (o la
    // fila todas las del nombre): sirve "Bravo Leiva, Agustina" y "Agustina Bravo".
    const found = byName.filter(student => words.every(word => student.words.includes(word)) || student.words.every(word => words.includes(word)))
    if (found.length === 0) {
      // Una fila de encabezado ("Nombre", "Nota") no es un problema.
      if (rows.indexOf(row) === 0 && !gradeCell) continue
      problems.push({ line: row.line, text: row.text, reason: 'No encontramos a ese estudiante en el Hall.' })
      continue
    }
    if (found.length > 1) {
      problems.push({ line: row.line, text: row.text, reason: 'Ese nombre calza con más de un estudiante. Agrega el apellido.' })
      continue
    }
    // Sin nota en la fila: se deja como estaba.
    if (!gradeCell) continue
    const grade = parseGrade(gradeCell)
    if (grade === 'invalid') {
      problems.push({ line: row.line, text: row.text, reason: 'No es una nota entre 1,0 y 7,0.' })
      continue
    }
    if (used.has(found[0].uid)) {
      problems.push({ line: row.line, text: row.text, reason: 'Ese estudiante sale dos veces.' })
      continue
    }
    used.add(found[0].uid)
    if (grade != null) matches.push({ uid: found[0].uid, grade })
  }
  return { matches, problems, mode: 'names' }
}
