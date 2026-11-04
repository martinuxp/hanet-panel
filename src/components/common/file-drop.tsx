import { Upload } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

/**
 * Zona para soltar archivos desde el computador. También se abre con clic o
 * con Enter, para usarla sin mouse.
 */
export function FileDrop({ onFiles, accept, multiple = false, title, hint, compact = false, disabled = false }: {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  title: string
  hint?: string
  compact?: boolean
  disabled?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  // dragenter y dragleave saltan en cada hijo; se cuenta para no parpadear.
  const depth = useRef(0)

  function take(list: FileList | null) {
    const files = Array.from(list ?? [])
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    depth.current = 0
    setOver(false)
    if (!disabled) take(event.dataTransfer.files)
  }

  return (
    <div
      onDragEnter={event => { event.preventDefault(); depth.current += 1; if (!disabled) setOver(true) }}
      onDragOver={event => event.preventDefault()}
      onDragLeave={() => { depth.current -= 1; if (depth.current <= 0) setOver(false) }}
      onDrop={onDrop}
      data-over={over ? 'true' : undefined}
      className={`flex items-center gap-4 rounded-(--radius-surface) border border-dashed border-(--border) bg-(--surface) transition-colors duration-(--duration-fast) data-[over=true]:border-(--accent) data-[over=true]:bg-(--accent-subtle) ${compact ? 'px-4 py-3' : 'flex-col justify-center px-6 py-8 text-center sm:flex-row sm:text-left'}`}
    >
      <span className={`grid shrink-0 place-items-center rounded-full bg-(--surface-muted) text-(--accent) ${compact ? 'size-9' : 'size-12'}`}>
        <Upload aria-hidden="true" className={compact ? 'size-4' : 'size-5'} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        {hint && <span className="text-(length:--text-sm) text-(--text-secondary)">{hint}</span>}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className="shrink-0 rounded-(--radius-control) border border-(--border) bg-(--surface) px-3 py-1.5 text-(length:--text-sm) font-medium transition-colors duration-(--duration-fast) hover:bg-(--surface-muted) disabled:text-(--text-muted)"
      >
        {multiple ? 'Elegir archivos' : 'Elegir archivo'}
      </button>
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={accept}
        multiple={multiple}
        onChange={event => { take(event.target.files); event.target.value = '' }}
      />
    </div>
  )
}
