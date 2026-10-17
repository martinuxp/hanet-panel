import { cn } from "cn"

// Isotipo HaNet (hanetcl/assets/icons/auth/logo-mark.svg). Siempre en accent;
// no se recolorea ni se redibuja.
export function HanetMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 47.0242 43" fill="none" aria-hidden="true" className={cn("h-7 w-auto", className)}>
      <path
        fill="#EF2274"
        d="M5.02344 40.8102V2.18981V0L15.3522 9.55556V19.5093L20.5166 20.1065V13.338L34.0234 14.5324V16.7222V26.2778V28.4676L20.5166 29.662V22.8935L15.3522 23.4907V33.4444L5.02344 43V40.8102Z"
      />
    </svg>
  )
}

// Logotipo para fondos oscuros: isotipo en accent y "HaNet Panel" en text-primary.
export function HanetLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <HanetMark />
      <span className="text-title3">
        HaNet <span className="font-medium text-hn-text-secondary">Panel</span>
      </span>
    </span>
  )
}
