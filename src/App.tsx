import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useArmwrestlers, type Arm, type Armwrestler } from './hooks/useArmwrestlers'
import SearchBar from './components/SearchBar'
import ArmToggle from './components/ArmToggle'
import RankingTable from './components/RankingTable'
import UnrankedList from './components/UnrankedList'
import LoginForm from './components/LoginForm'
import AddArmwrestlerForm from './components/AddArmwrestlerForm'
import Modal from './components/Modal'

export default function App() {
  const { loading, error, getRanking, getUnranked, addArmwrestler, removeArmwrestler, updateArmwrestler, reorderRank } = useArmwrestlers()
  const [arm, setArm] = useState<Arm>('left')
  const [query, setQuery] = useState('')
  const [admin, setAdmin] = useState(false)
  const [view, setView] = useState<'ranking' | 'login'>('ranking')
  const [editing, setEditing] = useState<Armwrestler | null>(null)
  const [editName, setEditName] = useState('')
  const [deleting, setDeleting] = useState<Armwrestler | null>(null)

  // Sesión real con Firebase Authentication (reemplaza el login de demostración).
  useEffect(() => onAuthStateChanged(auth, (user) => setAdmin(user !== null)), [])

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setView('ranking')
      return true
    } catch {
      return false
    }
  }
  const logout = () => {
    void signOut(auth)
  }

  const q = query.trim().toLowerCase()
  const match = (a: Armwrestler) => a.name.toLowerCase().includes(q)
  const ranked = getRanking(arm)
  const rankedShown = ranked.filter(match)
  const unrankedShown = getUnranked(arm).filter(match)
  const rankKey = arm === 'left' ? 'rankLeft' : 'rankRight'

  const openEdit = (a: Armwrestler) => {
    setEditing(a)
    setEditName(a.name)
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-8 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          <span className="size-2 rounded-full bg-volt" />
          Ranking del club
        </div>
        {admin ? (
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-volt/10 px-3 py-1 text-xs font-semibold text-volt-hi sm:inline">
              Modo sans
            </span>
            <button onClick={logout} className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-volt hover:text-volt-hi">
              Cerrar sesión
            </button>
          </div>
        ) : (
          view === 'ranking' && (
            <button onClick={() => setView('login')} className="text-xs text-mute underline-offset-4 transition hover:text-black hover:underline">
              Modo sans
            </button>
          )
        )}
      </header>

      {view === 'login' && !admin ? (
        <main className="px-4">
          <LoginForm onLogin={login} onCancel={() => setView('ranking')} />
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
          <div className="mt-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-5xl font-semibold leading-[1] tracking-tight sm:text-7xl">
              Ranking
              <br />
              <span className="text-volt">Armwrestlers</span>
            </h1>
            <div className="md:w-72">
              <SearchBar value={query} onChange={setQuery} />
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ArmToggle value={arm} onChange={setArm} />
            <p className="text-sm text-mute">
              {ranked.length} clasificados · {getUnranked(arm).length} sin clasificar
            </p>
          </div>

          {loading && <p className="mt-8 text-sm text-mute">Cargando ranking…</p>}
          {error && <p className="mt-8 text-sm text-red-600">{error}</p>}

          <div className="mt-8">
            <RankingTable
              arm={arm}
              rows={rankedShown}
              totalRanked={ranked.length}
              admin={admin}
              onMove={(id, dir) => reorderRank(id, arm, dir)}
              onUnrank={(id) => updateArmwrestler(id, { [rankKey]: null })}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          </div>

          <UnrankedList
            rows={unrankedShown}
            admin={admin}
            onRank={(id) => updateArmwrestler(id, { [rankKey]: ranked.length + 1 })}
            onEdit={openEdit}
            onDelete={setDeleting}
          />

          {admin && (
            <div className="mt-16">
              <AddArmwrestlerForm onAdd={addArmwrestler} />
            </div>
          )}
        </main>
      )}

      {editing && (
        <Modal title="Editar nombre" onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editName.trim()) updateArmwrestler(editing.id, { name: editName })
              setEditing(null)
            }}
          >
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink px-4 py-3 outline-none focus:border-volt focus:ring-2 focus:ring-volt/40"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm text-mute hover:text-black">
                Cancelar
              </button>
              <button className="rounded-xl bg-volt px-5 py-2.5 text-sm font-bold text-white hover:bg-volt-hi">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Eliminar armwrestler" onClose={() => setDeleting(null)}>
          <p className="text-mute">
            ¿Seguro que quieres eliminar a <strong className="text-zinc-900">{deleting.name}</strong> del sistema? Se quitará de ambos brazos y esta acción no se puede deshacer.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDeleting(null)} className="rounded-xl px-4 py-2.5 text-sm text-mute hover:text-black">
              Cancelar
            </button>
            <button
              onClick={() => {
                removeArmwrestler(deleting.id)
                setDeleting(null)
              }}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
