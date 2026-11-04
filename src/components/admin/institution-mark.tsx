import type { AdminInstitution } from '@/lib/hnt-admin'

const GENERIC = new Set(['colegio', 'liceo', 'instituto', 'escuela', 'complejo', 'educacional', 'de', 'del', 'la', 'las', 'los', 'el'])

/** "LCH Temuco" → LC, "Colegio Valle Pehuén" → VP, "Insuco Padre Las Casas" → IP. */
export function institutionInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  if (words[0] && words[0].length >= 2 && words[0] === words[0].toLocaleUpperCase('es')) return words[0].slice(0, 2)
  const meaningful = words.filter(word => !GENERIC.has(word.toLocaleLowerCase('es')))
  const source = meaningful.length > 0 ? meaningful : words
  return source.slice(0, 2).map(word => word[0]).join('').toLocaleUpperCase('es')
}

// Escudo de la institución, o sus iniciales mientras no tenga uno.
export function InstitutionMark({ institution, size = 'md' }: { institution: AdminInstitution; size?: 'sm' | 'md' | 'lg' }) {
  const box = { sm: 'size-9 text-(length:--text-xs)', md: 'size-11 text-(length:--text-sm)', lg: 'size-16 text-(length:--text-lg)' }[size]
  return (
    <span className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-(--radius-control) bg-(--surface-muted) font-medium text-(--foreground)`}>
      {institution.logoUrl
        ? <img src={institution.logoUrl} alt="" className="size-full object-contain p-1.5" />
        : institutionInitials(institution.name)}
    </span>
  )
}
