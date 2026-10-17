import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '@/components/arc/alert/alert'
import { Button } from '@/components/arc/button/button'
import { Input } from '@/components/arc/input/input'
import { PasswordField } from '@/components/arc/password-field/password-field'
import { HanetLogo } from '@/components/brand/logo'
import { useAuth } from '@/lib/auth'
import { auth } from '@/lib/firebase'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth.user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate({ to: '/' })
  }, [user, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      setError('El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <section className="flex w-full max-w-sm flex-col gap-6 rounded-(--radius-surface) bg-(--surface) p-8 shadow-(--shadow-raised)">
        <div className="flex flex-col gap-3">
          <HanetLogo />
          <h1 className="text-(length:--text-2xl) leading-tight font-medium tracking-tight">Entra al panel</h1>
          <p className="text-(--text-secondary)">Usa tu HaNet ID de docente, directiva o equipo HaNet.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input label="Correo" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordField
            label="Contraseña"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            messages={{ showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña' }}
          />
          <Alert tone="danger" title="No pudimos iniciar tu sesión" open={!!error}>
            {error}
          </Alert>
          <Button type="submit" size="lg" loading={loading}>
            Entrar
          </Button>
        </form>
      </section>
    </main>
  )
}
