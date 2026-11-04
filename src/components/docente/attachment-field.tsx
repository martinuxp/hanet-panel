import { FileText, X } from 'lucide-react'
import { Alert } from '@/components/arc/alert/alert'
import { FileDrop } from '@/components/common/file-drop'
import { DOCUMENT_LABELS, fileSize, type HallDocument } from '@/lib/classhall'
import { DOCUMENT_ACCEPT, documentProblem } from '@/lib/uploads'

/**
 * Un archivo opcional para una tarea, un aviso o una evaluación. Muestra el
 * que ya está en el Hall o el nuevo que se va a subir al guardar.
 */
export type AttachmentState = { kind: 'keep' } | { kind: 'remove' } | { kind: 'new'; file: File }

export function AttachmentField({ label, current, state, onChange, problem, onProblem, types, accept = DOCUMENT_ACCEPT, hint }: {
  label: string
  current: HallDocument | null
  state: AttachmentState
  onChange: (state: AttachmentState) => void
  problem: string | null
  onProblem: (problem: string | null) => void
  types?: string[]
  accept?: string
  hint?: string
}) {
  const shown = state.kind === 'new'
    ? { name: state.file.name, detail: `${fileSize(state.file.size)} · se sube al guardar` }
    : state.kind === 'keep' && current
      ? { name: current.name, detail: `${DOCUMENT_LABELS[current.kind]} · ${fileSize(current.size)}` }
      : null

  return (
    <div className="flex flex-col gap-2">
      <span className="text-(length:--text-sm) font-medium">{label}</span>
      {shown ? (
        <div className="flex items-center gap-3 rounded-(--radius-control) border border-(--border) px-3 py-2.5">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-(--accent)" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-(length:--text-sm) font-medium">{shown.name}</span>
            <span className="truncate text-(length:--text-xs) text-(--text-secondary)">{shown.detail}</span>
          </span>
          <button
            type="button"
            aria-label={`Quitar ${shown.name}`}
            onClick={() => onChange(current && state.kind === 'new' ? { kind: 'keep' } : { kind: 'remove' })}
            className="grid size-8 shrink-0 place-items-center rounded-(--radius-control) text-(--text-secondary) transition-colors duration-(--duration-fast) hover:bg-(--surface-muted) hover:text-(--foreground)"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : (
        <FileDrop
          compact
          accept={accept}
          title="Arrastra un archivo aquí"
          hint={hint ?? 'PDF, Word, PowerPoint, Excel o imagen, hasta 10 MB.'}
          onFiles={([file]) => {
            const issue = documentProblem(file, types)
            onProblem(issue)
            if (!issue) onChange({ kind: 'new', file })
          }}
        />
      )}
      <Alert tone="danger" title="No se puede subir ese archivo" open={!!problem}>{problem}</Alert>
    </div>
  )
}
