import type { AdminInstitution } from '@/lib/hnt-admin'

// Escudo de la institución, o sus iniciales mientras no tenga uno.
export function InstitutionMark({ institution, size = 'md' }: { institution: AdminInstitution; size?: 'sm' | 'md' | 'lg' }) {
  const box = { sm: 'size-9 text-(length:--text-xs)', md: 'size-11 text-(length:--text-sm)', lg: 'size-16 text-(length:--text-lg)' }[size]
  return (
    <span className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-(--radius-control) bg-(--hn-surface-raised) font-medium text-(--foreground)`}>
      {institution.logoUrl
        ? <img src={institution.logoUrl} alt="" className="size-full object-contain p-1.5" />
        : institution.name.slice(0, 2).toLocaleUpperCase('es')}
    </span>
  )
}
