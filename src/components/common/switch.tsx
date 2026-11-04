/** Interruptor de prendido y apagado, con role="switch" para lectores de pantalla. */
export function Switch({ checked, onChange, label, disabled = false, id }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-(--border) bg-(--surface-muted) transition-colors duration-(--duration-fast) aria-checked:border-(--accent) aria-checked:bg-(--accent) disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`inline-block size-4 rounded-full bg-(--foreground) shadow-sm transition-transform duration-(--duration-fast) motion-reduce:transition-none ${checked ? 'translate-x-[1.125rem] bg-(--accent-foreground)' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
