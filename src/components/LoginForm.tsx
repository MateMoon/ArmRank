import { useState } from 'react'

interface Props {
  onLogin: (email: string, password: string) => Promise<boolean>
  onCancel: () => void
}

export default function LoginForm({ onLogin, onCancel }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(!(await onLogin(email.trim(), password)))
  }

  const field =
    'w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm outline-none transition focus:border-volt focus:ring-2 focus:ring-volt/40'

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-line bg-panel p-7 shadow-sm sm:mt-20 sm:p-9">
      <h2 className="font-display text-5xl font-semibold leading-none">
        Acceso <span className="text-volt-hi">administrador</span>
      </h2>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">Correo</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">Contraseña</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
        {error && <p className="text-sm text-red-600">Correo o contraseña incorrectos.</p>}
        <button className="w-full rounded-xl bg-volt py-3 font-display text-xl font-semibold tracking-tight text-white transition hover:bg-volt-hi active:scale-[0.98]">
          Iniciar sesión
        </button>
        <button type="button" onClick={onCancel} className="w-full py-2 text-sm text-mute transition hover:text-black">
          Volver al ranking
        </button>
      </form>
    </div>
  )
}
