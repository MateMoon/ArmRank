import type { Arm, Armwrestler } from '../hooks/useArmwrestlers'
import AdminControls from './AdminControls'

interface Props {
  arm: Arm
  rows: Armwrestler[]
  totalRanked: number
  admin: boolean
  onMove: (id: string, dir: 'up' | 'down') => void
  onUnrank: (id: string) => void
  onEdit: (a: Armwrestler) => void
  onDelete: (a: Armwrestler) => void
}

export default function RankingTable({ arm, rows, totalRanked, admin, onMove, onUnrank, onEdit, onDelete }: Props) {
  const k = arm === 'left' ? 'rankLeft' : 'rankRight'

  return (
    <div>
      <div className="hidden grid-cols-[5rem_1fr_9rem_auto] gap-4 px-6 pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-mute md:grid">
        <span>Pos.</span>
        <span>Armwrestler</span>
        <span>Estado</span>
        {admin && <span className="w-[15.5rem]">Acciones</span>}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-mute">
          No hay atletas clasificados que coincidan.
        </p>
      ) : (
        <ol className="space-y-3">
          {rows.map((a) => {
            const pos = a[k] as number
            const podium = pos <= 3
            return (
              <li
                key={a.id}
                className={`grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-3 rounded-2xl border bg-panel px-4 py-4 transition hover:border-zinc-300 md:grid-cols-[5rem_1fr_9rem_auto] md:gap-x-4 md:px-6 ${
                  pos === 1 ? 'border-volt/40' : 'border-line'
                }`}
              >
                <span
                  className={`font-display text-5xl font-semibold leading-none md:text-6xl ${
                    podium ? 'text-volt-hi' : 'text-zinc-900'
                  }`}
                >
                  <span className="mr-0.5 text-2xl text-volt md:text-3xl">#</span>
                  {pos}
                </span>
                <span className="truncate text-base font-semibold md:text-lg">{a.name}</span>
                <span className="col-start-2 md:col-start-auto">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-volt/10 px-3 py-1 text-xs font-semibold text-volt-hi">
                    <span className="size-1.5 rounded-full bg-volt-hi" />
                    Clasificado
                  </span>
                </span>
                {admin && (
                  <div className="col-span-2 md:col-span-1 md:w-[15.5rem]">
                    <AdminControls
                      ranked
                      canUp={pos > 1}
                      canDown={pos < totalRanked}
                      onUp={() => onMove(a.id, 'up')}
                      onDown={() => onMove(a.id, 'down')}
                      onToggleRank={() => onUnrank(a.id)}
                      onEdit={() => onEdit(a)}
                      onDelete={() => onDelete(a)}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
