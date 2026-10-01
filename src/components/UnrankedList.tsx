import { useState } from 'react'
import type { Armwrestler } from '../hooks/useArmwrestlers'
import AdminControls from './AdminControls'

interface Props {
  rows: Armwrestler[]
  admin: boolean
  onRank: (id: string) => void
  onEdit: (a: Armwrestler) => void
  onDelete: (a: Armwrestler) => void
}

export default function UnrankedList({ rows, admin, onRank, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-14 rounded-2xl border border-line bg-panel">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-display text-2xl font-semibold tracking-tight">
          Unranked <span className="ml-2 text-volt-hi">({rows.length})</span>
        </span>
        <svg
          className={`size-5 text-mute transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="space-y-2 px-4 pb-4">
          {rows.length === 0 && <li className="px-2 py-4 text-center text-mute">Todos están clasificados en este brazo.</li>}
          {rows.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-ink px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-mute/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-mute">
                  Unranked
                </span>
                <span className="font-semibold">{a.name}</span>
              </div>
              {admin && (
                <AdminControls
                  ranked={false}
                  onToggleRank={() => onRank(a.id)}
                  onEdit={() => onEdit(a)}
                  onDelete={() => onDelete(a)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
