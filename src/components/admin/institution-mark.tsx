import type { AdminInstitution } from '@/lib/hnt-admin'

// Escudo de la institución, o sus iniciales mientras no tenga uno.
export function InstitutionMark({ institution, size = 'md' }: { institution: AdminInstitution; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-16 text-(length:--text-lg)' : 'size-11 text-(length:--text-sm)'
  return (
    <span className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-(--radius-control) bg-(--surface-muted) font-medium text-(--text-secondary)`}>
      {institution.logoUrl
        ? <img src={institution.logoUrl} alt="" className="size-full object-contain p-1.5" />
        : institution.name.slice(0, 2).toLocaleUpperCase('es')}
    </span>
  )
}
