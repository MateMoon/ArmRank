import { useState } from 'react'

export default function AddArmwrestlerForm({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onAdd(name.trim())
    setName('')
    setSaving(false)
  }
  return <form onSubmit={(e) => void submit(e)} className="rounded-xl border border-line bg-ink p-4">
    <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mute">Nombre completo</span><input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del atleta" className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-volt"/></label>
    <button disabled={saving} className="mt-3 rounded-xl bg-volt px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creando…' : 'Crear y agregar'}</button>
  </form>
}
