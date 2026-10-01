import { useState } from 'react'
import type { Armwrestler } from '../hooks/useArmwrestlers'

const parse = (v: string): number | null => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function AddArmwrestlerForm({ onAdd }: { onAdd: (d: Omit<Armwrestler, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name, rankLeft: parse(left), rankRight: parse(right) })
    setName('')
    setLeft('')
    setRight('')
  }

  const field =
    'w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm outline-none transition placeholder:text-mute focus:border-volt focus:ring-2 focus:ring-volt/40'
  const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute'

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <h2 className="font-display text-3xl font-semibold">Agregar armwrestler</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
        <label>
          <span className={label}>Nombre</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className={field} />
        </label>
        <label>
          <span className={label}>Pos. brazo izquierdo</span>
          <input type="number" min={1} value={left} onChange={(e) => setLeft(e.target.value)} placeholder="Vacío = Unranked" className={field} />
        </label>
        <label>
          <span className={label}>Pos. brazo derecho</span>
          <input type="number" min={1} value={right} onChange={(e) => setRight(e.target.value)} placeholder="Vacío = Unranked" className={field} />
        </label>
        <button className="rounded-xl bg-volt px-6 py-3 font-display text-xl font-semibold text-white transition hover:bg-volt-hi active:scale-95">
          Agregar
        </button>
      </div>
    </form>
  )
}
