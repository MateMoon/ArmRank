import { useEffect, useState } from 'react'

interface Props {
  canUp?: boolean
  canDown?: boolean
  onUp?: () => void
  onDown?: () => void
  position?: number
  maxPosition?: number
  onSetPosition?: (position: number) => void
  onToggleRank: () => void
  ranked: boolean
  onEdit: () => void
  onDelete: () => void
  onRemoveFromClub?: () => void
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-9 place-items-center rounded-lg border border-line bg-panel-2 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? 'hover:border-red-400 hover:text-red-600' : 'hover:border-volt hover:text-volt-hi'
      } enabled:active:scale-95`}
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

export default function AdminControls({ canUp, canDown, onUp, onDown, position, maxPosition, onSetPosition, onToggleRank, ranked, onEdit, onDelete, onRemoveFromClub }: Props) {
  const [newPosition, setNewPosition] = useState(position ?? 1)
  useEffect(() => setNewPosition(position ?? 1), [position])
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ranked && (
        <>
          <IconBtn label="Subir" onClick={onUp} disabled={!canUp}>
            <path d="m6 15 6-6 6 6" />
          </IconBtn>
          <IconBtn label="Bajar" onClick={onDown} disabled={!canDown}>
            <path d="m6 9 6 6 6-6" />
          </IconBtn>
          <form className="flex h-9 items-center gap-1" onSubmit={(event) => { event.preventDefault(); if (newPosition >= 1 && newPosition <= (maxPosition ?? 1)) onSetPosition?.(newPosition) }}>
            <label className="sr-only" htmlFor={`position-${position}`}>Nueva posición</label>
            <input id={`position-${position}`} aria-label="Nueva posición" type="number" min={1} max={maxPosition} value={newPosition} onChange={(event) => setNewPosition(Number(event.target.value))} className="h-9 w-16 rounded-lg border border-line bg-panel px-2 text-sm" />
            <button type="submit" className="h-9 rounded-lg border border-line bg-panel-2 px-2 text-xs font-semibold transition hover:border-volt hover:text-volt-hi">Ir</button>
          </form>
        </>
      )}
      <button
        onClick={onToggleRank}
        className="h-9 rounded-lg border border-line bg-panel-2 px-3 text-xs font-semibold transition hover:border-volt hover:text-volt-hi"
      >
        {ranked ? 'Pasar a unranked' : 'Clasificar'}
      </button>
      <IconBtn label="Editar nombre" onClick={onEdit}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </IconBtn>
      <IconBtn label="Eliminar" onClick={onDelete} danger>
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
      </IconBtn>
      {onRemoveFromClub && (
        <button onClick={onRemoveFromClub} className="h-9 rounded-lg border border-line bg-panel-2 px-3 text-xs font-semibold transition hover:border-red-400 hover:text-red-600">
          Quitar del club
        </button>
      )}
    </div>
  )
}
