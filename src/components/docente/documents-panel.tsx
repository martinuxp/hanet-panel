import { Check, ExternalLink, FileText, LoaderCircle, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FileDrop } from '@/components/common/file-drop'
import { attachHallDocument, deleteHallDocument, DOCUMENT_LABELS, fileSize, shortDate, type HallDetail, type HallDocument } from '@/lib/classhall'
import { describeError } from '@/lib/errors'
import { DOCUMENT_ACCEPT, documentProblem, stageFile } from '@/lib/uploads'

type Upload = { id: number; name: string; state: 'subiendo' | 'listo' | 'error'; message?: string }

let uploadId = 0

const listClass = 'flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)'

function documentRole(document: HallDocument) {
  if (document.evaluationId) return 'Tabla de especificaciones'
  if (document.taskId) return 'Material de tarea'
  if (document.announcementId) return 'Adjunto de un aviso'
  return null
}

/** Documentos del Hall: se arrastran varios a la vez desde el computador. */
export function DocumentsPanel({ detail, onChanged }: { detail: HallDetail; onChanged: () => void }) {
  const hallId = detail.hall.id
  const [uploads, setUploads] = useState<Upload[]>([])
  const [removing, setRemoving] = useState<HallDocument | null>(null)
  const documents = detail.documents ?? []

  function update(id: number, patch: Partial<Upload>) {
    setUploads(current => current.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }

  async function upload(files: File[]) {
    const queued = files.map(file => ({ file, id: ++uploadId, problem: documentProblem(file) }))
    setUploads(current => [
      ...current.filter(item => item.state === 'subiendo'),
      ...queued.map(({ file, id, problem }) => ({ id, name: file.name, state: problem ? 'error' as const : 'subiendo' as const, message: problem ?? undefined })),
    ])
    // De a uno: cada archivo llega a los estudiantes como material nuevo.
    for (const { file, id, problem } of queued) {
      if (problem) continue
      try {
        const staged = await stageFile(file)
        await attachHallDocument(hallId, staged.uploadPath, staged.name)
        update(id, { state: 'listo' })
        onChanged()
      } catch (failure) {
        update(id, { state: 'error', message: describeError(failure, 'No pudimos subirlo. Inténtalo nuevamente.') })
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FileDrop
        multiple
        accept={DOCUMENT_ACCEPT}
        onFiles={upload}
        title="Arrastra aquí guías, presentaciones o PDF"
        hint="Varios a la vez, hasta 10 MB cada uno. Los estudiantes reciben un aviso por cada archivo."
      />

      {uploads.length > 0 && (
        <ul aria-live="polite" className="flex flex-col gap-1.5">
          {uploads.map(item => (
            <li key={item.id} className="flex items-start gap-2.5 text-(length:--text-sm)">
              {item.state === 'subiendo' && <LoaderCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin text-(--text-secondary) motion-reduce:animate-none" />}
              {item.state === 'listo' && <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-(--success)" />}
              {item.state === 'error' && <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-(--danger)" />}
              <span className="min-w-0">
                <span className="font-medium">{item.name}</span>
                <span className="text-(--text-secondary)">
                  {item.state === 'subiendo' ? ' · subiendo' : item.state === 'listo' ? ' · listo' : ` · ${item.message}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {documents.length > 0 && (
        <ul className={listClass}>
          {documents.map(document => (
            <li key={document.id} className="flex items-center gap-1 pr-3">
              <a
                href={document.url}
                target="_blank"
                rel="noreferrer"
                className="group flex min-w-0 flex-1 items-center gap-3 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
              >
                <FileText aria-hidden="true" className="size-5 shrink-0 text-(--accent)" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{document.name}</span>
                  <span className="truncate text-(length:--text-sm) text-(--text-secondary)">
                    {[DOCUMENT_LABELS[document.kind], fileSize(document.size), documentRole(document), document.createdAt ? shortDate(document.createdAt) : null].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-(--text-muted) group-hover:text-(--foreground)" />
              </a>
              <button
                type="button"
                aria-label={`Eliminar ${document.name}`}
                onClick={() => setRemoving(document)}
                className="grid size-9 shrink-0 place-items-center rounded-(--radius-control) text-(--text-secondary) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted) hover:text-(--danger)"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={open => { if (!open) setRemoving(null) }}
        title="¿Eliminar el documento?"
        description={removing ? `«${removing.name}» deja de estar en el Hall para todos sus estudiantes.` : ''}
        confirmLabel="Eliminar"
        failure="No pudimos eliminarlo. Inténtalo nuevamente."
        onConfirm={async () => {
          if (!removing) return
          await deleteHallDocument(hallId, removing.id)
          onChanged()
        }}
      />
    </div>
  )
}
