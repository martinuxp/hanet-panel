// ClassHall falso del modo demo: Halls, tareas y entregas inventadas.
import type { Hall, HallDetail, HallSubmission, HallTaskDetail, HallTaskSummary, SubmissionItem } from '@/lib/classhall'

// Plazos a las 23:59, como los pone un docente.
const endOfToday = new Date().setHours(23, 59, 0, 0)
const now = Date.now()
const hour = 3_600_000
const day = 24 * hour

const STUDENTS = [
  'Agustina Bravo Leiva', 'Martín Cárdenas Ojeda', 'Florencia Díaz Rebolledo', 'Vicente Espinoza Mora',
  'Isidora Fuentes Catalán', 'Joaquín Garrido Peña', 'Antonia Henríquez Soto', 'Benjamín Ibáñez Torres',
  'Catalina Jara Muñoz', 'Lucas Lagos Figueroa', 'Emilia Medina Riquelme', 'Tomás Navarrete Vidal',
  'Josefa Olivares Pino', 'Maximiliano Parra Rojas', 'Trinidad Quezada Lillo', 'Matías Reyes Sanhueza',
  'Fernanda Salazar Cid', 'Gaspar Toledo Vera', 'Amanda Urrutia Bustos', 'Cristóbal Valdés Aravena',
  'Sofía Yáñez Carrasco', 'Diego Zúñiga Painemal', 'Renata Alarcón Huenchul', 'Simón Beltrán Ortiz',
]

// Una hoja de cuaderno escrita a mano, para que la entrega con foto tenga algo que mirar.
function notebookPhoto(lines: string[]) {
  const rows = lines.map((line, index) => `<text x="70" y="${118 + index * 46}" font-family="'Segoe Print','Comic Sans MS',cursive" font-size="26" fill="#23315c">${line}</text>`).join('')
  const ruled = Array.from({ length: 14 }, (_, index) => `<line x1="0" x2="800" y1="${126 + index * 46}" y2="${126 + index * 46}" stroke="#9db7d8" stroke-width="1.5"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="760" viewBox="0 0 800 760"><rect width="800" height="760" fill="#fbfaf4"/>${ruled}<line x1="52" x2="52" y1="0" y2="760" stroke="#e48b9d" stroke-width="2"/>${rows}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const PHOTO_A = notebookPhoto(['Guía 4: funciones lineales', '1) f(x) = 2x + 3', '   f(0) = 3  ;  f(2) = 7', '2) m = (9 − 1) / (4 − 0) = 2', '3) y = −x + 5 corta en (5, 0)', '4) f(x) = 3x − 2  →  f(−1) = −5 ?'])
const PHOTO_B = notebookPhoto(['Ejercicios pág. 42', 'a) pendiente = 1/2', 'b) intercepto = −4', 'c) gráfico en hoja aparte', 'd) son paralelas porque m₁ = m₂'])

const halls: Hall[] = [
  { id: 'mat-2k', subject: 'Matemática', courseId: 'Segundo Medio K', teacherName: 'Paula Sepúlveda', theme: 'math', plan: 'comun', isTeacher: true, code: null, memberCount: 32, nextEvaluation: { title: 'Prueba de funciones', date: now + 6 * day } },
  { id: 'fis-3a', subject: 'Física', courseId: 'Tercero Medio A', teacherName: 'Paula Sepúlveda', theme: 'physics', plan: 'comun', isTeacher: true, code: null, memberCount: 29, nextEvaluation: null },
  { id: 'prob-elec', subject: 'Probabilidades y estadística', courseId: 'Tercero y Cuarto Medio', teacherName: 'Paula Sepúlveda', theme: 'geometry', plan: 'electivo', isTeacher: true, code: 'K7Q2PX', memberCount: 18, nextEvaluation: { title: 'Control de distribuciones', date: now + 13 * day } },
]

type TaskStore = HallTaskSummary & { hallId: string; submissions: HallSubmission[] }

function submissionsFor(courseId: string, count: number, dueAt: number, reviewedCount: number): HallSubmission[] {
  return STUDENTS.slice(0, count).map((studentName, index) => {
    const submittedAt = dueAt - (count - index) * 3 * hour + (index % 3 === 0 ? 5 * hour : 0)
    const items: SubmissionItem[] = index % 3 === 0
      ? [{ id: `${index}-photo`, kind: 'file', name: 'Foto del cuaderno.jpg', fileKind: 'image', size: 1_480_000, url: index % 2 ? PHOTO_B : PHOTO_A }]
      : index % 3 === 1
        ? [{ id: `${index}-pdf`, kind: 'file', name: `Guía 4 - ${studentName.split(' ')[0]}.pdf`, fileKind: 'pdf', size: 640_000 + index * 12_000, url: '#' }]
        : [
            { id: `${index}-docx`, kind: 'file', name: 'Respuestas.docx', fileKind: 'word', size: 88_000, url: '#' },
            { id: `${index}-link`, kind: 'link', name: 'Gráfico en GeoGebra', url: 'https://www.geogebra.org/calculator' },
          ]
    const reviewed = index < reviewedCount
    return {
      uid: `alumno-${index}`,
      studentName,
      courseId,
      items,
      note: index % 4 === 1 ? 'Profe, el ejercicio 4 no me dio, lo dejé hasta donde llegué.' : '',
      submittedAt,
      late: submittedAt > dueAt,
      reviewed,
      feedback: reviewed && index % 2 === 0 ? 'Bien resuelto. Revisa el signo en el ejercicio 4.' : '',
      reviewedAt: reviewed ? submittedAt + day : null,
    }
  })
}

const tasks: TaskStore[] = [
  { hallId: 'mat-2k', id: 'guia-4', title: 'Guía 4: funciones lineales', instructions: 'Resuelve los ejercicios 1 al 6. Puedes subir foto del cuaderno.', dueAt: endOfToday + 2 * day, acceptLate: true, authorName: 'Paula Sepúlveda', createdAt: now - 5 * day, updatedAt: null, submissions: [] },
  { hallId: 'mat-2k', id: 'pag-42', title: 'Problemas de la página 42', instructions: 'Ejercicios a) al d).', dueAt: endOfToday - 6 * day, acceptLate: false, authorName: 'Paula Sepúlveda', createdAt: now - 14 * day, updatedAt: null, submissions: [] },
  { hallId: 'fis-3a', id: 'lab-1', title: 'Informe de laboratorio: péndulo', instructions: 'Informe en PDF, máximo 4 páginas.', dueAt: endOfToday + 4 * day, acceptLate: false, authorName: 'Paula Sepúlveda', createdAt: now - 3 * day, updatedAt: null, submissions: [] },
  { hallId: 'prob-elec', id: 'encuesta', title: 'Encuesta del curso', instructions: 'Tabula tus 30 respuestas y calcula la media.', dueAt: endOfToday - day, acceptLate: true, authorName: 'Paula Sepúlveda', createdAt: now - 9 * day, updatedAt: null, submissions: [] },
]
tasks[0].submissions = submissionsFor('Segundo Medio K', 18, tasks[0].dueAt, 4)
tasks[1].submissions = submissionsFor('Segundo Medio K', 24, tasks[1].dueAt, 24)
tasks[2].submissions = submissionsFor('Tercero Medio A', 7, tasks[2].dueAt, 0)
tasks[3].submissions = submissionsFor('Tercero Medio B', 15, tasks[3].dueAt, 9)

function summary({ submissions, hallId: _hallId, ...task }: TaskStore): HallTaskSummary {
  return { ...task, submittedCount: submissions.length }
}

function notFound(message: string): never {
  throw Object.assign(new Error(message), { code: 'functions/not-found' })
}

type Data = Record<string, unknown>

export function classhallCall(name: string, input: Data): unknown {
  switch (name) {
    case 'listMyHalls':
      return { halls: halls.map(hall => ({ ...hall })), canCreate: true }
    case 'getHall': {
      const hall = halls.find(item => item.id === input.hallId) ?? notFound('No encontramos ese Hall.')
      const detail: HallDetail = {
        hall: { ...hall },
        expectedSubmissions: hall.memberCount,
        tasks: tasks.filter(task => task.hallId === hall.id).map(summary),
        announcements: hall.id === 'mat-2k'
          ? [
              { id: 'a1', body: 'Mañana traigan calculadora y regla. Vemos gráficos de funciones.', authorName: hall.teacherName, createdAt: now - day, updatedAt: null },
              { id: 'a2', body: 'Subí la guía 4. Tienen hasta el viernes, y la reviso el fin de semana.', authorName: hall.teacherName, createdAt: now - 5 * day, updatedAt: null },
            ]
          : [],
        evaluations: hall.nextEvaluation
          ? [{
              id: 'e1', title: hall.nextEvaluation.title, date: hall.nextEvaluation.date, exigency: 60,
              skills: ['Conocimiento', 'Aplicación', 'Análisis'],
              contents: [{ name: 'Función lineal', detail: '', points: [6, 8, 4] }, { name: 'Función afín', detail: '', points: [4, 8, 6] }],
              objectives: [{ code: 'OA 3', text: '' }, { code: 'OA 4', text: '' }],
              prep: 'Guías 3 y 4.', authorName: hall.teacherName, updatedAt: null,
            }]
          : [],
        documents: hall.id === 'mat-2k'
          ? [
              { id: 'd1', name: 'Guía 4 - Funciones lineales.pdf', kind: 'pdf', size: 820_000, url: '#', authorName: hall.teacherName, announcementId: null, evaluationId: null, taskId: 'guia-4', createdAt: now - 5 * day },
              { id: 'd2', name: 'Clase 12 - Pendiente.pptx', kind: 'powerpoint', size: 3_400_000, url: '#', authorName: hall.teacherName, announcementId: null, evaluationId: null, createdAt: now - 8 * day },
              { id: 'd3', name: 'T.E. Prueba de funciones.pdf', kind: 'pdf', size: 210_000, url: '#', authorName: hall.teacherName, announcementId: null, evaluationId: 'e1', createdAt: now - 2 * day },
            ]
          : [],
      }
      return detail
    }
    case 'getHallTask': {
      const hall = halls.find(item => item.id === input.hallId) ?? notFound('No encontramos ese Hall.')
      const task = tasks.find(item => item.hallId === hall.id && item.id === input.taskId) ?? notFound('No encontramos esa tarea.')
      const { submissions, hallId: _hallId, ...rest } = task
      const detail: HallTaskDetail = {
        task: rest, attachment: null, subject: hall.subject, isTeacher: true,
        submissions: submissions.map(item => ({ ...item })), expectedSubmissions: hall.memberCount ?? undefined,
      }
      return detail
    }
    case 'saveHallTask': {
      const id = `tarea-${tasks.length + 1}`
      tasks.push({
        hallId: String(input.hallId), id, title: String(input.title), instructions: String(input.instructions ?? ''),
        dueAt: Number(input.dueAt), acceptLate: Boolean(input.acceptLate), authorName: 'Paula Sepúlveda',
        createdAt: Date.now(), updatedAt: null, submissions: [],
      })
      return { taskId: id }
    }
    case 'reviewHallSubmission': {
      const task = tasks.find(item => item.hallId === input.hallId && item.id === input.taskId) ?? notFound('No encontramos esa tarea.')
      const submission = task.submissions.find(item => item.uid === input.studentUid) ?? notFound('Esa entrega ya no existe.')
      submission.reviewed = input.reviewed !== false
      submission.feedback = String(input.feedback ?? '')
      submission.reviewedAt = submission.reviewed ? Date.now() : null
      return { ...submission }
    }
    default:
      return undefined
  }
}
