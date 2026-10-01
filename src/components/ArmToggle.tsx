import type { Arm } from '../hooks/useArmwrestlers'

const OPTIONS: { value: Arm; label: string }[] = [
  { value: 'left', label: 'Brazo izquierdo' },
  { value: 'right', label: 'Brazo derecho' },
]

export default function ArmToggle({ value, onChange }: { value: Arm; onChange: (a: Arm) => void }) {
  return (
    <div role="tablist" className="grid w-full grid-cols-2 gap-1 rounded-full border border-line bg-panel p-1 sm:w-auto">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-5 py-2.5 font-display text-lg font-semibold tracking-tight transition sm:px-8 ${
            value === o.value
              ? 'bg-volt text-white shadow-sm'
              : 'text-mute hover:text-black'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
