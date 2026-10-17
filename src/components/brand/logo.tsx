// Isotipo HaNet (hanetcl/assets/icons/auth/logo-mark.svg). Es la marca: va
// siempre en su rosa y no se recolorea.
export function HanetMark({ className }: { className?: string }) {
  return (
    <svg viewBox="5 0 29.0242 43" fill="none" aria-hidden="true" className={className ?? 'h-6 w-auto'}>
      <path
        fill="#EF2274"
        d="M5.02344 40.8102V2.18981V0L15.3522 9.55556V19.5093L20.5166 20.1065V13.338L34.0234 14.5324V16.7222V26.2778V28.4676L20.5166 29.662V22.8935L15.3522 23.4907V33.4444L5.02344 43V40.8102Z"
      />
    </svg>
  )
}

export function HanetLogo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <HanetMark />
      <span className="text-(length:--text-lg) font-medium tracking-tight">
        HaNet <span className="text-(--text-secondary)">Panel</span>
      </span>
    </span>
  )
}
