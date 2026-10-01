export default function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-line bg-panel p-6 shadow-sm"
      >
        <h3 className="font-display text-3xl font-semibold">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
