import { FileText, Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Textarea } from '@/components/arc/textarea/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { AttachmentField, type AttachmentState } from '@/components/docente/attachment-field'
import { applyAttachment } from '@/lib/attachments'
import {
  deleteHallAnnouncement, DOCUMENT_LABELS, fileSize, saveHallAnnouncement, shortDate,
  type HallAnnouncement, type HallDetail, type HallDocument,
} from '@/lib/classhall'
import { describeError } from '@/lib/errors'

/** Avisos del Hall: se escriben con teclado y pueden llevar un archivo. */
export function AnnouncementsPanel({ detail, onChanged }: { detail: HallDetail; onChanged: () => void }) {
  const hallId = detail.hall.id
  const [editing, setEditing] = useState<string | null>(null)
  const [removing, setRemoving] = useState<HallAnnouncement | null>(null)
  const attachmentOf = (id: string) => (detail.documents ?? []).find(document => document.announcementId === id) ?? null

  return (
    <div className="flex flex-col gap-6">
      <AnnouncementForm hallId={hallId} onSaved={onChanged} />

      {detail.announcements.length > 0 && (
        <ul className="flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)">
          {detail.announcements.map(item => {
            const attachment = attachmentOf(item.id)
            return (
              <li key={item.id} className="flex flex-col gap-3 px-5 py-4">
                {editing === item.id ? (
                  <AnnouncementForm
                    hallId={hallId}
                    announcement={item}
                    attachment={attachment}
                    onCancel={() => setEditing(null)}
                    onSaved={() => { setEditing(null); onChanged() }}
                  />
                ) : (
                  <>
                    <p className="whitespace-pre-line">{item.body}</p>
                    {attachment && <AttachmentLink document={attachment} />}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-(length:--text-sm) text-(--text-secondary)">
                        {item.authorName}{item.createdAt ? ` · ${shortDate(item.createdAt)}` : ''}{item.updatedAt ? ' · editado' : ''}
                      </p>
                      <span className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(item.id)}><Pencil aria-hidden="true" className="size-4" /> Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => setRemoving(item)}><Trash2 aria-hidden="true" className="size-4" /> Eliminar</Button>
                      </span>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={open => { if (!open) setRemoving(null) }}
        title="¿Eliminar el aviso?"
        description="Deja de verse en el Hall, junto con su archivo."
        confirmLabel="Eliminar"
        failure="No pudimos eliminar el aviso. Inténtalo nuevamente."
        onConfirm={async () => {
          if (!removing) return
          await deleteHallAnnouncement(hallId, removing.id)
          onChanged()
        }}
      />
    </div>
  )
}

function AttachmentLink({ document }: { document: HallDocument }) {
  return (
    <a
      href={document.url}
      target="_blank"
      rel="noreferrer"
      className="flex w-fit max-w-full items-center gap-2.5 rounded-(--radius-control) border border-(--border) px-3 py-2 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
    >
      <FileText aria-hidden="true" className="size-4 shrink-0 text-(--accent)" />
      <span className="truncate text-(length:--text-sm) font-medium">{document.name}</span>
      <span className="shrink-0 text-(length:--text-xs) text-(--text-secondary)">{DOCUMENT_LABELS[document.kind]} · {fileSize(document.size)}</span>
    </a>
  )
}

function AnnouncementForm({ hallId, announcement, attachment = null, onCancel, onSaved }: {
  hallId: string
  announcement?: HallAnnouncement
  attachment?: HallDocument | null
  onCancel?: () => void
  onSaved: () => void
}) {
  const [body, setBody] = useState(announcement?.body ?? '')
  const [file, setFile] = useState<AttachmentState>({ kind: 'keep' })
  const [fileProblem, setFileProblem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState(announcement?.id)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return setError('Escribe el aviso.')
    setError(null)
    setSaving(true)
    let id = savedId
    try {
      id = await saveHallAnnouncement(hallId, body.trim(), id)
    } catch (failure) {
      setSaving(false)
      return setError(describeError(failure, 'No pudimos publicar el aviso. Inténtalo nuevamente.'))
    }
    setSavedId(id)
    try {
      await applyAttachment(hallId, file, attachment, { announcementId: id })
      if (!announcement) {
        setBody('')
        setFile({ kind: 'keep' })
        setSavedId(undefined)
      }
      onSaved()
    } catch (failure) {
      setError(describeError(failure, 'El aviso quedó publicado, pero no pudimos subir el archivo. Inténtalo nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={announcement ? 'flex flex-col gap-3' : 'flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)'}
    >
      <Textarea
        id={announcement ? `aviso-${announcement.id}` : 'aviso-nuevo'}
        label={announcement ? 'Aviso' : 'Nuevo aviso'}
        description={announcement ? 'Editar no envía otra notificación.' : 'Lo ven todos los estudiantes del Hall y les llega una notificación.'}
        value={body}
        onChange={event => setBody(event.target.value)}
        onKeyDown={event => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') event.currentTarget.form?.requestSubmit()
        }}
        maxLength={2000}
        rows={announcement ? 4 : 3}
      />
      <AttachmentField label="Archivo (opcional)" current={attachment} state={file} onChange={setFile} problem={fileProblem} onProblem={setFileProblem} />
      <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!announcement && (
          <span className="mr-auto hidden text-(length:--text-xs) text-(--text-muted) sm:block">
            <kbd className="font-sans">Ctrl</kbd> o <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> publica
          </span>
        )}
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={saving}>{announcement ? 'Guardar cambios' : 'Publicar aviso'}</Button>
      </div>
    </form>
  )
}
