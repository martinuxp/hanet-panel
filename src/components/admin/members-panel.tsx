import { Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Avatar } from '@/components/arc/avatar/avatar'
import { Badge } from '@/components/arc/badge/badge'
import { Button } from '@/components/arc/button/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
import { EmptyState } from '@/components/arc/empty-state/empty-state'
import { SearchField } from '@/components/arc/search-field/search-field'
import { Select } from '@/components/arc/select/select'
import SegmentedControl from '@/components/arc/segmented-control/segmented-control'
import { Skeleton } from '@/components/arc/skeleton/skeleton'
import { useAuth } from '@/lib/auth'
import { describeError } from '@/lib/errors'
import {
  listMembers, MEMBER_ROLES, plural, setMemberBlocked, setMemberRole, unlinkMember,
  type AdminInstitution, type Member, type MemberRole,
} from '@/lib/hnt-admin'

const ROLE_NOTES: Record<MemberRole, string> = {
  Estudiante: 'Ve el calendario de su curso.',
  Directiva: 'Directiva de curso. Publica en el calendario de su curso.',
  CEE: 'Centro de estudiantes. Publica en el calendario de su curso.',
  Profesor: 'Docente. Crea Halls en ClassHall y publica en ellos.',
  Admin: 'Administración de la institución. Publica en el calendario.',
  HNT: 'Equipo HaNet. Además, entra a este panel.',
}

// La tabla crece de a una página; el buscador encuentra el resto.
const PAGE_ROWS = 50

type Filter = 'todas' | 'vinculadas' | 'sin-vincular' | 'bloqueadas'
const FILTERS: Record<Filter, (member: Member) => boolean> = {
  todas: () => true,
  vinculadas: member => !!member.uid && !member.blocked,
  'sin-vincular': member => !member.uid,
  bloqueadas: member => !!member.blocked,
}

export function MembersPanel({ institution }: { institution: AdminInstitution }) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')
  const [visible, setVisible] = useState(PAGE_ROWS)
  const [selected, setSelected] = useState<Member | null>(null)

  useEffect(() => {
    let active = true
    listMembers(institution.id)
      .then(result => {
        if (!active) return
        setMembers(result.members)
        setTruncated(result.truncated)
      })
      .catch(failure => { if (active) setError(describeError(failure, 'No pudimos cargar las personas. Inténtalo nuevamente.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt, institution.id])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    return members.filter(member => FILTERS[filter](member)
      && (!term || `${member.fullName} ${member.curso} ${member.email} ${member.role ?? ''}`.toLocaleLowerCase('es').includes(term)))
  }, [members, search, filter])

  const replace = (updated: Member) => {
    setMembers(list => list.map(member => (member.rut === updated.rut ? updated : member)))
    setSelected(current => (current?.rut === updated.rut ? updated : current))
  }

  if (loading) return <Skeleton label="Cargando personas" lines={5} />
  if (error) {
    return (
      <Alert tone="danger" title="No pudimos cargar las personas">
        {error}{' '}
        <button type="button" className="font-medium text-(--foreground) underline underline-offset-2" onClick={() => { setLoading(true); setError(null); setAttempt(count => count + 1) }}>Reintentar</button>
      </Alert>
    )
  }
  if (members.length === 0) {
    return <EmptyState icon={<Users />} title="La nómina está vacía" description="Cárgala en la pestaña Cargar nómina para que las personas puedan vincularse." />
  }

  const linked = members.filter(member => member.uid).length
  const count = (key: Filter) => members.filter(FILTERS[key]).length
  const share = Math.round((linked / members.length) * 100)

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-(--radius-surface) bg-(--surface) p-5 shadow-(--shadow-raised)">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p><span className="font-heading text-(length:--text-2xl) font-medium tabular-nums">{share}%</span> <span className="text-(--text-secondary)">vinculó su HaNet ID</span></p>
          <p className="text-(length:--text-sm) text-(--text-secondary) tabular-nums">
            {linked.toLocaleString('es-CL')} de {plural(members.length, 'persona', 'personas')}{truncated ? ' · se muestran las primeras 1.000' : ''}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-(--surface-muted)" role="meter" aria-label="Personas vinculadas" aria-valuemin={0} aria-valuemax={members.length} aria-valuenow={linked}>
          <div className="h-full rounded-full bg-(--accent) transition-[width] duration-(--duration-slow) ease-(--ease-enter)" style={{ width: `${share}%` }} />
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <SegmentedControl
          label="Filtrar personas"
          value={filter}
          onValueChange={value => { setFilter(value as Filter); setVisible(PAGE_ROWS) }}
          options={[
            { value: 'todas', label: `Todas ${count('todas')}` },
            { value: 'vinculadas', label: `Vinculadas ${count('vinculadas')}` },
            { value: 'sin-vincular', label: `Sin vincular ${count('sin-vincular')}` },
            { value: 'bloqueadas', label: `Bloqueadas ${count('bloqueadas')}` },
          ]}
        />
        <SearchField label="Buscar persona" value={search} onValueChange={value => { setSearch(value); setVisible(PAGE_ROWS) }} placeholder="Nombre, curso, correo o rol" className="w-full sm:w-72" />
      </div>

      <div className="overflow-x-auto rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)">
        <table className="w-full text-left">
          <thead className="border-b border-(--border) text-(length:--text-sm) text-(--text-secondary)">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Nombre</th>
              <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Curso</th>
              <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">Correo</th>
              <th scope="col" className="px-5 py-3 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, visible).map(member => {
              const isLinked = !!member.uid
              return (
                <tr
                  key={member.rut}
                  onClick={isLinked ? () => setSelected(member) : undefined}
                  className={`border-t border-(--border-subtle) first:border-t-0 transition-colors duration-(--duration-fast) ${isLinked ? 'cursor-pointer hover:bg-(--surface-muted)' : ''}`}
                >
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar name={member.fullName} size="sm" className={isLinked ? '' : 'opacity-60'} />
                      <span className="flex min-w-0 flex-col">
                        {isLinked
                          ? <button type="button" onClick={event => { event.stopPropagation(); setSelected(member) }} className="text-left font-medium">{member.fullName}</button>
                          : <span className="text-(--text-muted)">{member.fullName}</span>}
                        <span className="text-(length:--text-sm) text-(--text-secondary) sm:hidden">{member.curso}</span>
                      </span>
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 whitespace-nowrap text-(--text-secondary) sm:table-cell">{member.curso}</td>
                  <td className="hidden px-5 py-3 text-(--text-secondary) md:table-cell">{member.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap"><RoleBadge member={member} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p className="text-(--text-secondary)">Nadie coincide con esa búsqueda.</p>}
      {filtered.length > visible && (
        <Button variant="secondary" onClick={() => setVisible(count => count + PAGE_ROWS)} className="self-start">
          Mostrar {Math.min(PAGE_ROWS, filtered.length - visible)} más de {filtered.length.toLocaleString('es-CL')}
        </Button>
      )}

      <MemberDialog member={selected} isSelf={!!selected && selected.uid === user?.uid} onClose={() => setSelected(null)} onChange={replace} />
    </div>
  )
}

function RoleBadge({ member }: { member: Member }) {
  if (member.blocked) return <Badge tone="warning" size="sm">Bloqueada</Badge>
  if (!member.uid) return <span className="text-(length:--text-sm) text-(--text-muted)">Sin vincular</span>
  // Estudiante es lo común; los demás roles tienen permisos y se marcan.
  return <Badge tone={member.role === 'Estudiante' ? 'neutral' : 'info'} size="sm">{member.role}</Badge>
}

type Confirm = 'block' | 'unlink' | null

function MemberDialog({ member, isSelf, onClose, onChange }: {
  member: Member | null
  isSelf: boolean
  onClose: () => void
  onChange: (member: Member) => void
}) {
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mantiene el contenido mientras el diálogo se anima al cerrar.
  const [shown, setShown] = useState<Member | null>(member)
  if (member && member !== shown) setShown(member)

  const close = () => {
    if (busy) return
    setConfirm(null)
    setError(null)
    onClose()
  }

  // El rol nuevo se ve al tiro y se revierte si no se guarda.
  const changeRole = async (role: MemberRole) => {
    if (!shown?.uid || busy || role === shown.role) return
    const previous = shown
    onChange({ ...shown, role })
    setBusy(true)
    setError(null)
    try {
      await setMemberRole(shown.uid, role)
    } catch (failure) {
      onChange(previous)
      setError(describeError(failure, 'No pudimos cambiar el rol. Inténtalo nuevamente.'))
    } finally {
      setBusy(false)
    }
  }

  const toggleBlocked = async () => {
    if (!shown?.uid || busy) return
    const blocked = !shown.blocked
    setBusy(true)
    setError(null)
    try {
      await setMemberBlocked(shown.uid, blocked)
      onChange({ ...shown, blocked })
      setConfirm(null)
    } catch (failure) {
      setError(describeError(failure, blocked ? 'No pudimos bloquear esta cuenta.' : 'No pudimos desbloquear esta cuenta.'))
    } finally {
      setBusy(false)
    }
  }

  const unlink = async () => {
    if (!shown?.uid || busy) return
    setBusy(true)
    setError(null)
    try {
      await unlinkMember(shown.uid)
      onChange({ ...shown, uid: null, role: null })
      setConfirm(null)
      setBusy(false)
      onClose()
    } catch (failure) {
      setError(describeError(failure, 'No pudimos desvincular a esta persona.'))
      setBusy(false)
    }
  }

  const role = shown?.role ?? 'Estudiante'

  return (
    <Dialog open={!!member} onOpenChange={open => { if (!open) close() }}>
      <DialogContent title={shown?.fullName ?? ''} description={shown ? `${shown.curso} · ${shown.email}` : undefined}>
        {shown && (
          <div className="flex flex-col gap-5">
            {confirm === null && (
              <>
                <Select
                  label="Rol"
                  value={role}
                  onValueChange={value => void changeRole(value as MemberRole)}
                  options={MEMBER_ROLES.map(item => ({ value: item, label: item }))}
                  description={isSelf ? 'No puedes cambiar tu propio rol.' : ROLE_NOTES[role]}
                  disabled={busy || isSelf}
                />
                <Alert tone="danger" title="No se guardó el cambio" open={!!error}>{error}</Alert>
                {!isSelf && (
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="ghost" onClick={() => { setError(null); setConfirm('unlink') }} disabled={busy}>Desvincular</Button>
                    <Button variant={shown.blocked ? 'secondary' : 'danger'} onClick={() => { setError(null); setConfirm('block') }} disabled={busy}>
                      {shown.blocked ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {confirm === 'block' && (
              <>
                <p className="text-(--text-secondary)">
                  {shown.blocked
                    ? 'Podrá volver a iniciar sesión en HaNet con su cuenta.'
                    : 'No podrá iniciar sesión en HaNet y su sesión abierta se cerrará. Verá la pantalla de cuenta bloqueada, con la opción de apelar por correo. Su vínculo y su rol se conservan.'}
                </p>
                <Alert tone="danger" title="No se guardó el cambio" open={!!error}>{error}</Alert>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => { setConfirm(null); setError(null) }} disabled={busy}>Cancelar</Button>
                  <Button variant={shown.blocked ? 'primary' : 'danger'} onClick={() => void toggleBlocked()} loading={busy}>
                    {shown.blocked ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                </div>
              </>
            )}

            {confirm === 'unlink' && (
              <>
                <p className="text-(--text-secondary)">
                  Al desvincularla pierde su rol y el acceso al calendario de su curso. Conserva su HaNet ID y puede volver a vincularse con su correo institucional.
                </p>
                <Alert tone="danger" title="No se desvinculó" open={!!error}>{error}</Alert>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => { setConfirm(null); setError(null) }} disabled={busy}>Cancelar</Button>
                  <Button variant="danger" onClick={() => void unlink()} loading={busy}>Desvincular</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
