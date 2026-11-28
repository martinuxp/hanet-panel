import { useNavigate } from '@tanstack/react-router'
import { Check, Circle } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { setInstitutionClosure, type AdminInstitution } from '@/lib/hnt-admin'
import { updateInstitution } from '@/lib/use-institutions'
import { adminsOf, useSetupMembers } from './members-store'
import { PromoPanel } from './promo-panel'
import { SETUP_STEPS, missingSteps, type SetupStepId } from './steps'

/** Último paso: qué quedó hecho y el botón para abrir HaNet al liceo. */
export function OpenStep({ institution, onGo }: { institution: AdminInstitution; onGo: (step: SetupStepId) => void }) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [opened, setOpened] = useState(false)
  const members = useSetupMembers(institution)?.members ?? null
  const admins = members ? adminsOf(members) : null
  const extra = { admins: admins?.length ?? null }
  const missing = missingSteps(institution, extra)
  const closed = !!institution.closure?.active

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-(--border-subtle) overflow-hidden rounded-(--radius-panel) border border-(--border-subtle)">
        {SETUP_STEPS.filter(step => step.id !== 'abrir').map(step => {
          const done = step.done(institution, extra)
          return (
            <li key={step.id} className="flex items-center gap-3 px-5 py-3">
              {done
                ? <Check aria-hidden="true" className="size-4 shrink-0 text-(--accent)" />
                : <Circle aria-hidden="true" className="size-4 shrink-0 text-(--text-muted)" />}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{step.label}</span>
                <span className="text-(length:--text-sm) text-(--text-secondary)">{(step.id === 'admin' && admins?.length ? admins.map(member => member.fullName).join(', ') : summary(step.id, institution)) ?? (step.optional ? 'Opcional, se puede hacer después' : 'Falta')}</span>
              </span>
              {!done && <Button variant="ghost" size="sm" onClick={() => onGo(step.id)}>Completar</Button>}
            </li>
          )
        })}
      </ul>

      {closed && (
        <div className="flex flex-col gap-3">
          <p className="text-(--text-secondary)">
            HaNet está cerrado para {institution.name}: solo el equipo HaNet, su administración{institution.closure?.teachers ? ' y sus docentes' : ''} pueden entrar.
            Al abrirlo, todas las personas de la nómina pueden unirse con el código.
          </p>
          {missing.length > 0 && (
            <Alert tone="warning" title={missing.length === 1 ? 'Falta 1 paso' : `Faltan ${missing.length} pasos`}>
              Puedes abrirlo igual, pero {missing.map(step => step.label.toLowerCase()).join(', ')} {missing.length === 1 ? 'queda' : 'quedan'} pendiente{missing.length === 1 ? '' : 's'}.
            </Alert>
          )}
          <Button onClick={() => setConfirming(true)} className="self-start">Abrir HaNet a {institution.name}</Button>
        </div>
      )}

      {!closed && (
        <div className="flex flex-col gap-3">
          <Alert tone="success" title={opened ? `${institution.name} ya está abierta` : `${institution.name} está abierta`}>
            Las personas de la nómina pueden unirse con el código. Lo demás se sigue cambiando desde la institución.
          </Alert>
          <Button variant="secondary" className="self-start" onClick={() => void navigate({ to: '/instituciones/$institutionId', params: { institutionId: institution.id } })}>Ir a la institución</Button>
        </div>
      )}

      <PromoPanel institution={institution} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone="primary"
        title={`¿Abrir HaNet a ${institution.name}?`}
        description="Desde ahora, quienes estén en la nómina pueden unirse y usar la app. Si hace falta, se vuelve a cerrar desde la institución."
        confirmLabel="Abrir HaNet"
        failure="No pudimos abrir HaNet. Inténtalo nuevamente."
        onConfirm={async () => {
          await setInstitutionClosure(institution.id, { closed: false })
          updateInstitution(institution.id, { closure: null })
          setOpened(true)
        }}
      />
    </div>
  )
}

function summary(id: SetupStepId, institution: AdminInstitution): string | null {
  switch (id) {
    case 'datos': return institution.cityId ? institution.fullName || institution.name : null
    case 'ano': {
      const year = institution.schoolYear
      return year ? `${formatDay(year.start)} al ${formatDay(year.end)}` : null
    }
    case 'modulos': return Array.isArray(institution.modules)
      ? (institution.modules.length ? `Base y ${institution.modules.length === 1 ? '1 módulo' : `${institution.modules.length} módulos`}` : 'Solo la base')
      : null
    case 'marca': return institution.logoUrl ? (institution.bannerUrl ? 'Escudo y banner' : 'Escudo, sin banner') : null
    case 'nomina': return institution.rosterCount > 0 ? `${institution.rosterCount.toLocaleString('es-CL')} ${institution.rosterCount === 1 ? 'persona' : 'personas'}` : null
    case 'codigo': return institution.hasInviteCode ? 'Generado' : null
    default: return null
  }
}

function formatDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}
