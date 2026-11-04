import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Download, Link2, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Input } from '@/components/arc/input/input'
import { Select } from '@/components/arc/select/select'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { Textarea } from '@/components/arc/textarea/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FileDrop } from '@/components/common/file-drop'
import { BackLink } from '@/components/docente/back-link'
import { describeError } from '@/lib/errors'
import {
  categoryFromType, deleteEvent, downloadCsv, EVENT_CATEGORIES, eventDate, getEvent, importEventFromUrl, JORNADA_LABELS,
  MAX_COVER_BYTES, saveEvent, SIGNUP_LABELS, stageCover, type EventInput, type EventJornada, type EventKind, type HnEvent, type SignupMode,
} from '@/lib/events'
import { plural } from '@/lib/hnt-admin'
import { useLoad } from '@/lib/use-load'

export const Route = createFileRoute('/_panel/eventos/$eventId')({
  validateSearch: (search: Record<string, unknown>): { tipo?: EventKind } =>
    search.tipo === 'regional' || search.tipo === 'institution' ? { tipo: search.tipo } : {},
  component: EventPage,
})

type Form = {
  title: string
  category: string
  description: string
  startsAt: string
  endsAt: string
  venueName: string
  address: string
  city: string
  region: string
  imageUrl: string
  priceFrom: string
  isFree: boolean
  ticketUrl: string
  sourceName: string
  sourceUrl: string
  jornada: EventJornada
  signupMode: SignupMode
  capacity: string
}

function two(value: number) {
  return String(value).padStart(2, '0')
}

function toLocalInput(ms: number | null) {
  if (!ms) return ''
  const date = new Date(ms)
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`
}

function formFrom(event: HnEvent | null, kind: EventKind): Form {
  return {
    title: event?.title ?? '',
    category: event?.category ?? (kind === 'regional' ? 'concert' : 'community'),
    description: event?.description ?? '',
    startsAt: toLocalInput(event?.startsAt ?? null),
    endsAt: toLocalInput(event?.endsAt ?? null),
    venueName: event?.venueName ?? '',
    address: event?.address ?? '',
    city: event?.city ?? (kind === 'regional' ? 'Temuco' : ''),
    region: event?.region ?? (kind === 'regional' ? 'Araucanía' : ''),
    imageUrl: event?.imageUrl ?? '',
    priceFrom: event?.priceFrom ? String(event.priceFrom) : '',
    isFree: event?.isFree ?? false,
    ticketUrl: event?.ticketUrl ?? '',
    sourceName: event?.sourceName ?? '',
    sourceUrl: event?.sourceUrl ?? '',
    jornada: event?.jornada ?? 'ambas',
    signupMode: event?.signupMode ?? 'none',
    capacity: event?.capacity ? String(event.capacity) : '',
  }
}

function EventPage() {
  const { eventId } = Route.useParams()
  const { tipo } = Route.useSearch()
  const isNew = eventId === 'nuevo'
  const { data, error, retry } = useLoad(() => (isNew ? Promise.resolve(null) : getEvent(eventId)), [eventId], 'No pudimos abrir el evento. Inténtalo nuevamente.')
  const kind: EventKind = data?.kind ?? tipo ?? 'institution'
  const back = <BackLink to="/eventos" search={{ tipo: kind }}>Eventos</BackLink>

  if (error) {
    return <div className="flex flex-col gap-6">{back}<Alert tone="danger" title="No pudimos abrir el evento">{error}{' '}<Button variant="ghost" size="sm" onClick={retry}>Reintentar</Button></Alert></div>
  }
  if (!isNew && !data) return <div className="flex flex-col gap-6">{back}<Skeleton label="Cargando evento" lines={6} /></div>

  return (
    <div className="flex flex-col gap-6">
      {back}
      <header className="flex flex-col gap-1">
        <p className="text-(--text-secondary)">{kind === 'regional' ? 'Evento de la ciudad' : 'Evento del liceo'}</p>
        <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display) text-balance">{data ? data.title : 'Nuevo evento'}</h1>
      </header>
      {data && data.kind === 'institution' && data.signupMode !== 'none' && <Signups event={data} />}
      <EventForm key={data?.id ?? 'nuevo'} event={data} kind={kind} />
    </div>
  )
}

function Signups({ event }: { event: HnEvent }) {
  const list = event.signups ?? []
  return (
    <section className="flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">Inscritos</h2>
          <p className="text-(length:--text-sm) text-(--text-secondary)">
            {plural(event.signupCount ?? list.length, 'persona inscrita', 'personas inscritas')}{event.capacity ? ` de ${event.capacity} cupos` : ''}
          </p>
        </div>
        {list.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCsv(`Inscritos - ${event.title}.csv`, [['Nombre', 'Curso', 'Inscripción'], ...list.map(item => [item.name, item.courseId, item.createdAt ? eventDate(item.createdAt) : ''])])}
          >
            <Download aria-hidden="true" className="size-4" /> Descargar para Excel
          </Button>
        )}
      </div>
      {event.signupMode === 'count' ? (
        <p className="text-(length:--text-sm) text-(--text-secondary)">Este evento cuenta cuántos van, sin lista de nombres.</p>
      ) : list.length > 0 && (
        <div className="max-h-80 overflow-y-auto rounded-(--radius-control) border border-(--border-subtle)">
          <table className="w-full text-(length:--text-sm)">
            <thead className="sticky top-0 bg-(--surface)">
              <tr className="text-left text-(--text-secondary)">
                <th scope="col" className="px-3 py-2 font-medium">Nombre</th>
                <th scope="col" className="px-3 py-2 font-medium">Curso</th>
                <th scope="col" className="px-3 py-2 font-medium">Inscripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-subtle)">
              {list.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-(--text-secondary)">{item.courseId}</td>
                  <td className="px-3 py-2 text-(--text-secondary) tabular-nums">{item.createdAt ? eventDate(item.createdAt) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function EventForm({ event, kind }: { event: HnEvent | null; kind: EventKind }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(() => formFrom(event, kind))
  const [cover, setCover] = useState<{ file: File; preview: string } | null>(null)
  const [coverProblem, setCoverProblem] = useState<string | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importNote, setImportNote] = useState<{ tone: 'info' | 'warning' | 'danger'; text: string; warnings: string[] } | null>(null)
  const [importedImages, setImportedImages] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const regional = kind === 'regional'
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(current => ({ ...current, [key]: value }))
  const backToList = () => navigate({ to: '/eventos', search: { tipo: kind } })

  async function runImport() {
    if (!importUrl.trim() || importing) return
    setImporting(true)
    setImportNote(null)
    try {
      const draft = await importEventFromUrl(importUrl.trim())
      const category = categoryFromType(draft.typeLabel)
      setForm(current => ({
        ...current,
        title: draft.title || current.title,
        description: draft.description || current.description,
        startsAt: draft.startsAt ? toLocalInput(draft.startsAt) : current.startsAt,
        endsAt: draft.endsAt ? toLocalInput(draft.endsAt) : current.endsAt,
        venueName: draft.venueName || current.venueName,
        address: draft.address || current.address,
        city: draft.city || current.city,
        imageUrl: draft.imageUrl || current.imageUrl,
        priceFrom: draft.priceFrom ? String(draft.priceFrom) : current.priceFrom,
        ticketUrl: draft.ticketUrl || current.ticketUrl,
        sourceName: draft.sourceName,
        sourceUrl: draft.sourceUrl,
        ...(category ? { category } : {}),
      }))
      if (draft.images.length) setImportedImages(draft.images)
      const missing = [!draft.startsAt && 'la fecha', !draft.venueName && 'el lugar', !draft.priceFrom && 'el precio'].filter(Boolean)
      setImportNote({
        tone: draft.testOnly || draft.warnings.length ? 'warning' : 'info',
        text: missing.length ? `Listo. Revisa los datos y completa ${missing.join(', ')}.` : 'Listo. Revisa los datos antes de publicar.',
        warnings: draft.warnings,
      })
    } catch (failure) {
      setImportNote({ tone: 'danger', text: describeError(failure, 'No pudimos leer esa página. Carga el evento a mano.'), warnings: [] })
    } finally {
      setImporting(false)
    }
  }

  function pickCover(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setCoverProblem('La portada tiene que ser JPG, PNG o WebP.')
    if (file.size > MAX_COVER_BYTES) return setCoverProblem('La portada pesa más de 5 MB.')
    setCoverProblem(null)
    setCover({ file, preview: URL.createObjectURL(file) })
  }

  async function submit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    const startsAt = new Date(form.startsAt).getTime()
    const endsAt = form.endsAt ? new Date(form.endsAt).getTime() : null
    if (form.title.trim().length < 3) return setError('Escribe el nombre del evento.')
    if (!Number.isFinite(startsAt)) return setError('Elige cuándo empieza.')
    if (endsAt !== null && (!Number.isFinite(endsAt) || endsAt < startsAt)) return setError('El término tiene que ser después del inicio.')
    setError(null)
    setSaving(true)
    try {
      // Lo que el panel no muestra (cupón, nota editorial, auspicio) se mantiene como está.
      const input: EventInput = {
        ...(event ? { sponsored: event.sponsored, perk: event.perk, coupon: event.coupon, editorial: event.editorial } : {}),
        id: event?.id,
        kind,
        status: 'published',
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        startsAt,
        endsAt,
        venueName: form.venueName.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        region: form.region.trim(),
        ...(regional
          ? {
              priceFrom: form.isFree ? null : Number(form.priceFrom) || null,
              isFree: form.isFree,
              ticketUrl: form.ticketUrl.trim(),
              sourceName: form.sourceName.trim(),
              sourceUrl: form.sourceUrl.trim(),
              imageUrl: form.imageUrl.trim() || null,
            }
          : {
              jornada: form.jornada,
              signupMode: form.signupMode,
              capacity: form.signupMode === 'none' ? null : Number(form.capacity) || null,
            }),
        ...(importedImages ? { galleryKeep: event?.gallery ?? [], galleryUrls: importedImages } : {}),
      }
      if (cover) input.uploadPath = await stageCover(cover.file)
      await saveEvent(input)
      void backToList()
    } catch (failure) {
      setError(describeError(failure, 'No pudimos guardar el evento. Inténtalo nuevamente.'))
    } finally {
      setSaving(false)
    }
  }

  const coverPreview = cover?.preview ?? (form.imageUrl || null)

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {regional && (
        <section className="flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
          <div className="flex flex-col gap-1">
            <h2 className="font-medium">Importar desde link</h2>
            <p className="text-(length:--text-sm) text-(--text-secondary)">Pega el link del evento en la ticketera y HaNet llena el formulario.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-[1_1_20rem]">
              <Input
                id="evento-link"
                label="Link del evento"
                type="url"
                placeholder="https://www.portaltickets.cl/..."
                value={importUrl}
                onChange={inputEvent => setImportUrl(inputEvent.target.value)}
                onKeyDown={keyEvent => { if (keyEvent.key === 'Enter') { keyEvent.preventDefault(); void runImport() } }}
              />
            </div>
            <Button type="button" variant="secondary" loading={importing} disabled={!importUrl.trim()} onClick={runImport}>
              <Link2 aria-hidden="true" className="size-4" /> Importar
            </Button>
          </div>
          {importNote && (
            <Alert tone={importNote.tone} title={importNote.tone === 'danger' ? 'No se pudo importar' : 'Importado'}>
              {importNote.text}
              {importNote.warnings.length > 0 && <ul className="mt-1 list-disc pl-4">{importNote.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
            </Alert>
          )}
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Input id="evento-nombre" label="Nombre" value={form.title} onChange={inputEvent => set('title', inputEvent.target.value)} maxLength={120} required />
          <Select id="evento-categoria" label="Categoría" value={form.category} onValueChange={value => set('category', value)} options={EVENT_CATEGORIES} />
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Input id="evento-inicio" label="Empieza" type="datetime-local" value={form.startsAt} onChange={inputEvent => set('startsAt', inputEvent.target.value)} required />
          <Input id="evento-termino" label="Termina" description="Opcional." type="datetime-local" value={form.endsAt} onChange={inputEvent => set('endsAt', inputEvent.target.value)} />
        </div>
        <Textarea id="evento-descripcion" label="Descripción" value={form.description} onChange={inputEvent => set('description', inputEvent.target.value)} maxLength={4000} rows={5} />
      </section>

      <section className="grid items-start gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised) sm:grid-cols-2">
        <Input id="evento-lugar" label="Lugar" placeholder={regional ? 'Teatro Municipal' : 'Gimnasio del liceo'} value={form.venueName} onChange={inputEvent => set('venueName', inputEvent.target.value)} maxLength={120} />
        <Input id="evento-direccion" label="Dirección" description="Opcional." value={form.address} onChange={inputEvent => set('address', inputEvent.target.value)} maxLength={160} />
        <Input id="evento-ciudad" label="Ciudad" value={form.city} onChange={inputEvent => set('city', inputEvent.target.value)} maxLength={60} />
        <Input id="evento-region" label="Región" value={form.region} onChange={inputEvent => set('region', inputEvent.target.value)} maxLength={60} />
      </section>

      {regional ? (
        <section className="flex flex-col gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Input id="evento-precio" label="Precio desde (CLP)" type="number" inputMode="numeric" min={0} disabled={form.isFree} value={form.priceFrom} onChange={inputEvent => set('priceFrom', inputEvent.target.value)} />
            <label className="flex items-center gap-2 text-(length:--text-sm) sm:mt-9">
              <input type="checkbox" checked={form.isFree} onChange={inputEvent => set('isFree', inputEvent.target.checked)} className="size-4 accent-(--accent)" />
              Entrada gratuita
            </label>
            <Input id="evento-entradas" label="Link para comprar entradas" type="url" value={form.ticketUrl} onChange={inputEvent => set('ticketUrl', inputEvent.target.value)} />
            <Input id="evento-fuente" label="Fuente" description="Se muestra como origen de los datos." value={form.sourceName} onChange={inputEvent => set('sourceName', inputEvent.target.value)} maxLength={60} />
          </div>
        </section>
      ) : (
        <section className="grid items-start gap-4 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised) sm:grid-cols-3">
          <Select id="evento-jornada" label="Para" value={form.jornada} onValueChange={value => set('jornada', value as EventJornada)}
            options={(Object.keys(JORNADA_LABELS) as EventJornada[]).map(value => ({ value, label: JORNADA_LABELS[value] }))} />
          <Select id="evento-inscripcion" label="Inscripción" value={form.signupMode} onValueChange={value => set('signupMode', value as SignupMode)}
            options={(Object.keys(SIGNUP_LABELS) as SignupMode[]).map(value => ({ value, label: SIGNUP_LABELS[value] }))} />
          <Input id="evento-cupos" label="Cupos" description="Opcional." type="number" inputMode="numeric" min={1} disabled={form.signupMode === 'none'} value={form.capacity} onChange={inputEvent => set('capacity', inputEvent.target.value)} />
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <h2 className="font-medium">Portada</h2>
        {coverPreview && (
          <div className="relative w-full max-w-md">
            <img src={coverPreview} alt="" className="aspect-[1.91/1] w-full rounded-(--radius-control) object-cover" />
            <button
              type="button"
              aria-label="Quitar la portada"
              onClick={() => { setCover(null); set('imageUrl', '') }}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-(--radius-control) bg-(--surface) text-(--foreground) shadow-(--shadow-raised)"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
        <FileDrop compact accept="image/jpeg,image/png,image/webp" title={coverPreview ? 'Reemplazar la portada' : 'Arrastra aquí la portada'} hint="JPG, PNG o WebP de hasta 5 MB. Horizontal se ve mejor." onFiles={([file]) => pickCover(file)} />
        <Alert tone="danger" title="No se puede usar esa imagen" open={!!coverProblem}>{coverProblem}</Alert>
      </section>

      <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
      <div className="flex flex-wrap items-center gap-2">
        {event?.canEdit && (
          <Button type="button" variant="danger" onClick={() => setRemoving(true)}><Trash2 aria-hidden="true" className="size-4" /> Eliminar</Button>
        )}
        <span className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={() => void backToList()}>Cancelar</Button>
          <Button type="submit" loading={saving}>{event ? 'Guardar cambios' : 'Publicar evento'}</Button>
        </span>
      </div>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="¿Eliminar el evento?"
        description="Sale de la app junto con sus inscripciones y reacciones. No se puede deshacer."
        confirmLabel="Eliminar evento"
        failure="No pudimos eliminar el evento. Inténtalo nuevamente."
        onConfirm={async () => {
          if (!event) return
          await deleteEvent(event.id)
          void backToList()
        }}
      />
    </form>
  )
}
