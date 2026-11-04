import { useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Switch } from '@/components/common/switch'
import { describeError } from '@/lib/errors'
import { MODULES, setInstitutionModules, type AdminInstitution, type ModuleId } from '@/lib/hnt-admin'
import { updateInstitution } from '@/lib/use-institutions'

/** Prender y apagar módulos. Un módulo apagado se apaga en el backend, no solo se esconde. */
export function ModulesPanel({ institution }: { institution: AdminInstitution }) {
  const active = institution.modules ?? MODULES.map(module => module.id)
  const [busy, setBusy] = useState<ModuleId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(id: ModuleId, on: boolean) {
    let next = on ? [...active, id] : active.filter(item => item !== id)
    // Las encuestas viven dentro del Feed.
    if (id === 'feed' && !on) next = next.filter(item => item !== 'polls')
    if (id === 'polls' && on && !next.includes('feed')) next = [...next, 'feed']
    setBusy(id)
    setError(null)
    try {
      updateInstitution(institution.id, { modules: await setInstitutionModules(institution.id, next) })
    } catch (failure) {
      setError(describeError(failure, 'No pudimos cambiar el módulo. Inténtalo nuevamente.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-(--text-secondary)">
        La base (Calendar, ClassHall y eventos del liceo) siempre está prendida. Un módulo apagado deja de responder en la app para todo el liceo.
      </p>
      {institution.modules == null && (
        <Alert tone="info" title="Todavía no tiene lista de módulos">Por eso todos están prendidos. Al cambiar uno, se guarda la lista completa.</Alert>
      )}
      <ul className="flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-surface) bg-(--surface) shadow-(--shadow-raised)">
        {MODULES.map(module => {
          const on = active.includes(module.id)
          return (
            <li key={module.id} className="flex items-center gap-4 px-5 py-4">
              <label htmlFor={`modulo-${module.id}`} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
                <span className="font-medium">{module.name}</span>
                <span className="text-(length:--text-sm) text-(--text-secondary)">{module.description}</span>
              </label>
              <span className="w-16 text-right text-(length:--text-sm) text-(--text-secondary)" aria-hidden="true">{on ? 'Prendido' : 'Apagado'}</span>
              <Switch id={`modulo-${module.id}`} label={module.name} checked={on} disabled={busy !== null} onChange={value => void toggle(module.id, value)} />
            </li>
          )
        })}
      </ul>
      <Alert tone="danger" title="No se guardó" open={!!error}>{error}</Alert>
    </div>
  )
}
