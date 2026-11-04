import { ref, uploadBytes } from 'firebase/storage'
import { auth, storage } from '@/lib/firebase'

// Los archivos del docente pasan primero por su carpeta (classhall-uploads/{uid},
// ver storage.rules de hanetcl) y después una función los mueve al Hall. Igual
// que la app: el panel nunca escribe directo en el Hall.

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

/** Los tipos que acepta attachHallDocument. */
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]

/** Lo que scanSpecTable sabe leer. */
export const SPEC_TABLE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

export const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png'

// Algunos navegadores no traen el tipo de los archivos de Office.
const TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

export function fileType(file: File) {
  if (file.type && DOCUMENT_TYPES.includes(file.type)) return file.type
  return TYPE_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? file.type
}

/** Por qué no se puede subir este archivo, o null si se puede. */
export function documentProblem(file: File, types = DOCUMENT_TYPES) {
  if (!types.includes(fileType(file))) {
    return types === SPEC_TABLE_TYPES
      ? 'Sube la tabla en PDF, Word (.docx) o como foto (JPG o PNG).'
      : 'Sube un PDF, Word, PowerPoint, Excel o una imagen JPG o PNG.'
  }
  if (file.size > MAX_DOCUMENT_BYTES) return 'El archivo pesa más de 10 MB.'
  if (file.size === 0) return 'El archivo está vacío.'
  return null
}

export type StagedFile = { uploadPath: string; name: string }

/** Sube el archivo a la carpeta del docente. Después se adjunta con attachHallDocument. */
export async function stageFile(file: File): Promise<StagedFile> {
  if (import.meta.env.VITE_DEMO === '1') return (await import('@/demo/classhall')).demoStage(file)
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Inicia sesión para subir archivos.')
  const uploadPath = `classhall-uploads/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await uploadBytes(ref(storage, uploadPath), file, { contentType: fileType(file) })
  return { uploadPath, name: file.name }
}
