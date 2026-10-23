import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collectionGroup, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import { GENERAL_CLUB_ID, type Arm, type Armwrestler, type ClubMember } from './hooks/useArmwrestlers'
import { useArmwrestlers } from './hooks/useArmwrestlers'
import { useClubs } from './hooks/useClubs'
import { useClubMembers } from './hooks/useClubMembers'
import { migrateLegacyData } from './hooks/migrateLegacyData'
import SearchBar from './components/SearchBar'
import ArmToggle from './components/ArmToggle'
import RankingTable from './components/RankingTable'
import UnrankedList from './components/UnrankedList'
import LoginForm from './components/LoginForm'
import AddArmwrestlerForm from './components/AddArmwrestlerForm'
import Modal from './components/Modal'

export default function App() {
  const athletes = useArmwrestlers()
  const clubData = useClubs()
  const [admin, setAdmin] = useState(false)
  const [viewLogin, setViewLogin] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<Armwrestler | null>(null)
  const [deleting, setDeleting] = useState<Armwrestler | null>(null)

  useEffect(() => onAuthStateChanged(auth, (user) => setAdmin(user !== null)), [])
  useEffect(() => onSnapshot(collectionGroup(db, 'members'), (snap) => {
    const next: Record<string, number> = {}
    snap.docs.forEach((d) => { const id = d.ref.parent.parent?.id; if (id) next[id] = (next[id] ?? 0) + 1 })
    setCounts(next)
  }, (e) => console.error(e)), [])

  const login = async (email: string, password: string) => {
    try { await signInWithEmailAndPassword(auth, email, password); setViewLogin(false); return true } catch { return false }
  }
  const logout = () => { void signOut(auth) }
  const allErrors = athletes.error || clubData.error

  return <div className="min-h-screen bg-ink">
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-8 sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"><span className="size-2 rounded-full bg-volt" />Ranking de armwrestling</Link>
      <div className="flex items-center gap-2">
        {admin ? <button onClick={logout} className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-volt hover:text-volt-hi">Cerrar sesión</button> :
          <button onClick={() => setViewLogin(!viewLogin)} className="text-xs text-mute underline-offset-4 transition hover:text-black hover:underline">{viewLogin ? 'Volver' : 'Modo administrador'}</button>}
      </div>
    </header>
    {viewLogin && !admin ? <main className="px-4"><LoginForm onLogin={login} onCancel={() => setViewLogin(false)} /></main> : <>
      {allErrors && <p className="mx-auto mt-4 max-w-5xl px-4 text-sm text-red-600">{allErrors}</p>}
      <Routes>
        <Route path="/" element={<Home clubs={clubData.clubs} counts={counts} admin={admin} loading={clubData.loading || athletes.loading} onAddClub={clubData.addClub} onRenameClub={clubData.renameClub} onDeleteClub={clubData.deleteClub} onMigrate={async () => {
          setBusy(true); setStatus('')
          try { const result = await migrateLegacyData(); setStatus(result === 'migrated' ? 'Migración completa. Se descargó el respaldo JSON.' : 'Los datos ya están migrados; no se hicieron cambios.') }
          catch (e) { console.error(e); setStatus('No se pudo completar la migración. Revisa las reglas de Firestore y la conexión.') }
          finally { setBusy(false) }
        }} busy={busy} status={status} />} />
        <Route path="/club/:clubId" element={<ClubPage clubs={clubData.clubs} athletes={athletes.items} loadingAthletes={athletes.loading} admin={admin} onRename={setEditing} onDelete={setDeleting} onCreateArmwrestler={(name, id) => athletes.createArmwrestler(name, id)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>}
    {editing && <Modal title="Editar nombre global" onClose={() => setEditing(null)}><EditName initial={editing.name} onCancel={() => setEditing(null)} onSave={async (name) => { await athletes.renameArmwrestler(editing.id, name); setEditing(null) }} /></Modal>}
    {deleting && <Modal title="Eliminar atleta global" onClose={() => setDeleting(null)}>
      <p className="text-mute">¿Eliminar a <strong className="text-zinc-900">{deleting.name}</strong> de todos los clubes? Esta acción elimina todas sus membresías y no se puede deshacer.</p>
      <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="rounded-xl px-4 py-2.5 text-sm text-mute hover:text-black">Cancelar</button><button onClick={async () => { await athletes.deleteArmwrestler(deleting.id); setDeleting(null) }} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Eliminar de todos</button></div>
    </Modal>}
  </div>
}

function Home({ clubs, counts, admin, loading, onAddClub, onRenameClub, onDeleteClub, onMigrate, busy, status }: {
  clubs: { id: string; name: string }[]; counts: Record<string, number>; admin: boolean; loading: boolean
  onAddClub: (name: string) => Promise<void>; onRenameClub: (id: string, name: string) => Promise<void>; onDeleteClub: (id: string) => Promise<void>
  onMigrate: () => void; busy: boolean; status: string
}) {
  const clubsSorted = useMemo(() => [...clubs].sort((a, b) => a.id === GENERAL_CLUB_ID ? -1 : b.id === GENERAL_CLUB_ID ? 1 : a.name.localeCompare(b.name)), [clubs])
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState('')
  const [editName, setEditName] = useState('')
  return <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
    <div className="mt-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-volt-hi">Comunidades</p><h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-tight sm:text-7xl">Ranking<br/><span className="text-volt">Armwrestlers</span></h1><p className="mt-5 max-w-xl text-mute">Elige un club para consultar y gestionar sus rankings.</p></div>
    {loading && <p className="mt-8 text-sm text-mute">Cargando clubes…</p>}
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubsSorted.map((club) => <article key={club.id} className={`rounded-2xl border bg-panel p-5 ${club.id === GENERAL_CLUB_ID ? 'border-volt/50' : 'border-line'}`}>
        <Link to={`/club/${club.id}`} className="block"><p className="text-xs font-semibold uppercase tracking-wider text-volt-hi">{club.id === GENERAL_CLUB_ID ? 'Destacado' : 'Club'}</p><h2 className="mt-2 font-display text-2xl font-semibold">{club.name}</h2><p className="mt-2 text-sm text-mute">{counts[club.id] ?? 0} armwrestlers</p></Link>
        {admin && club.id !== GENERAL_CLUB_ID && <div className="mt-4 flex gap-2 border-t border-line pt-3">
          {editId === club.id ? <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); void onRenameClub(club.id, editName); setEditId('') }}><input value={editName} onChange={(e) => setEditName(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm"/><button className="text-sm font-semibold text-volt-hi">Guardar</button><button type="button" onClick={() => setEditId('')} className="text-sm text-mute">Cancelar</button></form> : <><button onClick={() => { setEditId(club.id); setEditName(club.name) }} className="text-xs font-semibold text-mute hover:text-volt-hi">Renombrar</button><button onClick={() => { if (window.confirm(`¿Eliminar el club ${club.name} y sus membresías? Los atletas globales se conservarán.`)) void onDeleteClub(club.id) }} className="text-xs font-semibold text-red-600">Eliminar club</button></>}
        </div>}
      </article>)}
    </div>
    {admin && <section className="mt-12 rounded-2xl border border-line bg-panel p-5 sm:p-6"><h2 className="font-display text-2xl font-semibold">Administrar clubes</h2><form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (newName.trim()) { void onAddClub(newName); setNewName('') } }}><input required maxLength={60} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del nuevo club" className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-4 py-3 text-sm"/><button className="rounded-xl bg-volt px-5 py-3 text-sm font-bold text-white hover:bg-volt-hi">Crear club</button></form><div className="mt-5 border-t border-line pt-4"><button disabled={busy} onClick={onMigrate} className="rounded-xl border border-volt px-4 py-2.5 text-sm font-semibold text-volt-hi disabled:opacity-50">{busy ? 'Migrando…' : 'Migrar datos a clubes'}</button><p className="mt-2 text-xs text-mute">Antes de escribir, se descargará un respaldo JSON de los datos antiguos.</p>{status && <p className="mt-3 text-sm text-mute">{status}</p>}</div></section>}
  </main>
}

function ClubPage({ clubs, athletes, loadingAthletes, admin, onRename, onDelete, onCreateArmwrestler }: {
  clubs: { id: string; name: string }[]; athletes: Armwrestler[]; loadingAthletes: boolean; admin: boolean
  onRename: (a: Armwrestler) => void; onDelete: (a: Armwrestler) => void
  onCreateArmwrestler: (name: string, clubId?: string) => Promise<void>
}) {
  const { clubId = '' } = useParams()
  const navigate = useNavigate()
  const club = clubs.find((c) => c.id === clubId)
  const data = useClubMembers(clubId, athletes)
  const [arm, setArm] = useState<Arm>('left')
  const [query, setQuery] = useState('')
  const [existingQuery, setExistingQuery] = useState('')
  const [removeTarget, setRemoveTarget] = useState<ClubMember | null>(null)
  const ranked = data.getRanking(arm)
  const unranked = data.getUnranked(arm)
  const q = query.trim().toLowerCase()
  const filter = (a: ClubMember) => a.name.toLowerCase().includes(q)
  const membersIds = new Set(data.members.map((m) => m.id))
  const candidates = athletes.filter((a) => !membersIds.has(a.id) && a.name.toLowerCase().includes(existingQuery.trim().toLowerCase()))
  if (!club && !loadingAthletes) return <main className="mx-auto max-w-4xl px-4 py-20"><p className="text-mute">No se encontró este club.</p><Link to="/" className="mt-4 inline-block text-volt-hi underline">Volver al inicio</Link></main>
  return <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
    <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><Link to="/" className="text-sm font-semibold text-volt-hi hover:underline">← Todos los clubes</Link><h1 className="mt-4 font-display text-5xl font-semibold leading-none tracking-tight sm:text-7xl">{club?.name ?? 'Cargando…'}</h1><p className="mt-3 text-sm text-mute">{data.rows.length} armwrestlers en este club</p></div><div className="w-full sm:w-72"><label className="sr-only" htmlFor="club-select">Cambiar de club</label><select id="club-select" value={clubId} onChange={(e) => navigate(`/club/${e.target.value}`)} className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm">{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><ArmToggle value={arm} onChange={setArm}/><p className="text-sm text-mute">{ranked.length} clasificados · {unranked.length} sin clasificar</p></div>
    <div className="mt-5"><SearchBar value={query} onChange={setQuery}/></div>
    {(data.loading || loadingAthletes) && <p className="mt-8 text-sm text-mute">Cargando ranking…</p>}{data.error && <p className="mt-5 text-sm text-red-600">{data.error}</p>}
    <div className="mt-7"><RankingTable arm={arm} rows={ranked.filter(filter)} totalRanked={ranked.length} admin={admin} onMove={(id, dir) => void data.reorderRank(id, arm, dir)} onUnrank={(id) => void data.setRank(id, arm, null)} onEdit={(a) => onRename(a)} onDelete={(a) => onDelete(a)} onRemoveFromClub={clubId === GENERAL_CLUB_ID ? undefined : (a) => setRemoveTarget(a)}/></div>
    <UnrankedList rows={unranked.filter(filter)} admin={admin} onRank={(id) => void data.setRank(id, arm, ranked.length + 1)} onEdit={onRename} onDelete={onDelete} onRemoveFromClub={clubId === GENERAL_CLUB_ID ? undefined : setRemoveTarget}/>
    {admin && <section className="mt-12 rounded-2xl border border-line bg-panel p-5 sm:p-6"><h2 className="font-display text-3xl font-semibold">Agregar armwrestler</h2><div className="mt-5 grid gap-6 md:grid-cols-2"><div><h3 className="text-sm font-semibold">Elegir atleta existente</h3><input value={existingQuery} onChange={(e) => setExistingQuery(e.target.value)} placeholder="Buscar atleta" className="mt-2 w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm"/><div className="mt-3 max-h-52 space-y-2 overflow-auto">{candidates.slice(0, 30).map((a) => <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"><span className="truncate text-sm">{a.name}</span><button onClick={() => void data.addToClub(a.id)} className="shrink-0 text-xs font-semibold text-volt-hi">Agregar</button></div>)}{!candidates.length && <p className="text-sm text-mute">No hay coincidencias disponibles.</p>}</div></div><div><h3 className="mb-2 text-sm font-semibold">Crear un atleta global</h3><AddArmwrestlerForm onAdd={(name) => onCreateArmwrestler(name, clubId)}/><p className="mt-2 text-xs text-mute">Se agrega automáticamente a Ranking general y a este club.</p></div></div></section>}
    {removeTarget && <Modal title="Quitar del club" onClose={() => setRemoveTarget(null)}><p className="text-mute">¿Quitar a <strong className="text-zinc-900">{removeTarget.name}</strong> de {club?.name}? La persona seguirá en Ranking general y en otros clubes.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setRemoveTarget(null)} className="rounded-xl px-4 py-2.5 text-sm text-mute">Cancelar</button><button onClick={() => { void data.removeFromClub(removeTarget.id); setRemoveTarget(null) }} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white">Quitar</button></div></Modal>}
  </main>

}

function EditName({ initial, onCancel, onSave }: { initial: string; onCancel: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial)
  return <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name) }}><input autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-line bg-ink px-4 py-3 outline-none focus:border-volt focus:ring-2 focus:ring-volt/40"/><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm text-mute">Cancelar</button><button className="rounded-xl bg-volt px-5 py-2.5 text-sm font-bold text-white">Guardar</button></div></form>
}
