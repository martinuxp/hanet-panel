import type { AttachmentState } from '@/components/docente/attachment-field'
import { attachHallDocument, deleteHallDocument, type DocumentAttach, type HallDocument } from '@/lib/classhall'
import { stageFile } from '@/lib/uploads'

/** Aplica lo que el docente eligió para el archivo: subir uno nuevo (reemplaza al anterior) o quitarlo. */
export async function applyAttachment(hallId: string, state: AttachmentState, current: HallDocument | null, attach: DocumentAttach) {
  if (state.kind === 'new') {
    const staged = await stageFile(state.file)
    await attachHallDocument(hallId, staged.uploadPath, staged.name, attach)
  } else if (state.kind === 'remove' && current) {
    await deleteHallDocument(hallId, current.id)
  }
}
