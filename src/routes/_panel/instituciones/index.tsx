import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Building2, ChevronRight } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { Input } from '@/components/arc/input/input'
import { SearchField } from '@/components/arc/search-field/search-field'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { InstitutionMark } from '@/components/admin/institution-mark'
import { describeError } from '@/lib/errors'
import { createInstitution, plural } from '@/lib/hnt-admin'
import { reloadInstitutions, useInstitutions } from '@/lib/use-institutions'

export const Route = createFileRoute('/_panel/instituciones/')({
  component: InstitutionsPage,
})

function InstitutionsPage() {
  const { institutions, loading, loaded, error } = useInstitutions()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    if (!term) return institutions
    return institutions.filter(item => `${item.name} ${item.fullName}`.toLocaleLowerCase('es').includes(term))
  }, [institutions, search])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-(length:--text-3xl) leading-(--leading-display) font-medium tracking-(--tracking-display)">Instituciones</h1>
          <p className="text-(--text-secondary)">Códigos de invitación, nóminas y roles de cada institución.</p>
        </div>
        <Button onClick={() => setCreating(true)}>Nueva institución</Button>
      </div>

      <Alert tone="danger" title="No pudimos cargar las instituciones" open={!!error}>
        {error}{' '}
        <button type="button" className="font-medium text-(--foreground) underline underline-offset-2" onClick={() => void reloadInstitutions()}>Reintentar</button>
      </Alert>

      {!loaded && loading && <Skeleton label="Cargando instituciones" lines={4} avatar />}

      {loaded && institutions.length === 0 && (
        <EmptyState
          icon={<Building2 />}
          title="Todavía no hay instituciones"
          description="Crea la primera para generar su código y cargar su nómina."
          action={<Button variant="secondary" onClick={() => setCreating(true)}>Nueva institución</Button>}
        />
      )}

      {institutions.length > 0 && (
        <div className="flex flex-col gap-4">
          {institutions.length > 5 && (
            <SearchField label="Buscar institución" value={search} onValueChange={setSearch} placeholder="Nombre o nombre completo" />
          )}
          <ul className="flex flex-col overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-resting)">
            {filtered.map(institution => (
              <li key={institution.id} className="border-b border-(--border-subtle) last:border-b-0">
                <Link
                  to="/instituciones/$institutionId"
                  params={{ institutionId: institution.id }}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors duration-(--duration-fast) hover:bg-(--surface-muted)"
                >
                  <InstitutionMark institution={institution} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{institution.name}</span>
                    <span className="truncate text-(length:--text-sm) text-(--text-secondary)">
                      {plural(institution.rosterCount, 'persona', 'personas')} · {institution.hasInviteCode ? 'con código' : 'sin código'}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && <p className="text-(--text-secondary)">Ninguna institución coincide con esa búsqueda.</p>}
        </div>
      )}

      <CreateInstitutionDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

function CreateInstitutionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Escribe el nombre corto de la institución.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const id = await createInstitution(name.trim(), fullName.trim())
      await reloadInstitutions()
      onOpenChange(false)
      setName('')
      setFullName('')
      void navigate({ to: '/instituciones/$institutionId', params: { institutionId: id } })
    } catch (failure) {
      setError(describeError(failure, 'No pudimos crear la institución.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!busy) onOpenChange(next) }}>
      <DialogContent title="Nueva institución" description="Después podrás generar su código y cargar su nómina.">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="Nombre corto" value={name} onChange={event => setName(event.target.value)} placeholder="LCH Temuco" disabled={busy} autoFocus />
          <Input label="Nombre completo (opcional)" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Liceo Camilo Henríquez de Temuco" disabled={busy} />
          <Alert tone="danger" title="No se creó la institución" open={!!error}>{error}</Alert>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
            <Button type="submit" loading={busy}>Crear institución</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
