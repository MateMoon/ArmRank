export default function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Buscar por nombre</span>
      <svg
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar armwrestler..."
        className="w-full rounded-full border border-line bg-panel py-3 pl-11 pr-4 text-sm text-zinc-900 placeholder:text-mute outline-none transition focus:border-volt focus:ring-2 focus:ring-volt/40"
      />
    </label>
  )
}
