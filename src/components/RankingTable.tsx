import type { Arm, ClubMember } from '../hooks/useArmwrestlers'
import AdminControls from './AdminControls'

interface Props {
  arm: Arm
  rows: ClubMember[]
  totalRanked: number
  admin: boolean
  onMove: (id: string, dir: 'up' | 'down') => void
  onUnrank: (id: string) => void
  onEdit: (a: ClubMember) => void
  onDelete: (a: ClubMember) => void
  onRemoveFromClub?: (a: ClubMember) => void
}

export default function RankingTable({ arm, rows, totalRanked, admin, onMove, onUnrank, onEdit, onDelete, onRemoveFromClub }: Props) {
  const k = arm === 'left' ? 'rankLeft' : 'rankRight'

  return (
    <div>
      <div className="hidden grid-cols-[5rem_1fr_auto] gap-4 px-6 pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-mute md:grid">
        <span>Pos.</span>
        <span>Armwrestler</span>
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
                className={`grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-2 gap-y-3 rounded-2xl border bg-panel px-3 py-4 transition hover:border-zinc-300 md:grid-cols-[5rem_1fr_auto] md:gap-x-4 md:px-6 ${
                  pos === 1 ? 'border-volt/40' : 'border-line'
                }`}
              >
                <span
                  className={`whitespace-nowrap font-display text-4xl font-semibold leading-none md:text-4xl ${
                    podium ? 'text-volt-hi' : 'text-zinc-900'
                  }`}
                >
                  <span className="mr-0.5 text-xl text-volt md:text-3xl">#</span>
                  {pos}
                </span>
                <span className="truncate text-base font-semibold md:text-lg">{a.name}</span>
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
                      onRemoveFromClub={onRemoveFromClub ? () => onRemoveFromClub(a) : undefined}
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
