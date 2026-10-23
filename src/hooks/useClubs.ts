import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { GENERAL_CLUB_ID, type Club } from './useArmwrestlers'

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => onSnapshot(collection(db, 'clubs'), (snap) => {
    setClubs(snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? '') })))
    setLoading(false)
  }, (err) => { console.error(err); setError('No se pudieron cargar los clubes.'); setLoading(false) }), [])

  const addClub = async (name: string) => run(() => setDoc(doc(collection(db, 'clubs')), { name: name.trim() }))
  const renameClub = async (id: string, name: string) => {
    if (id === GENERAL_CLUB_ID) return
    await run(() => setDoc(doc(db, 'clubs', id), { name: name.trim() }))
  }
  const deleteClub = async (id: string) => {
    if (id === GENERAL_CLUB_ID) return
    try {
      const members = await getDocs(collection(db, 'clubs', id, 'members'))
      for (let i = 0; i < members.docs.length; i += 499) {
        const batch = writeBatch(db)
        members.docs.slice(i, i + 499).forEach((d) => batch.delete(d.ref))
        if (i + 499 >= members.docs.length) batch.delete(doc(db, 'clubs', id))
        await batch.commit()
      }
      if (!members.size) await deleteDoc(doc(db, 'clubs', id))
      setError(null)
    } catch (e) { console.error(e); setError('No se pudo eliminar el club. Revisa tu sesión y tu conexión.') }
  }
  async function run(action: () => Promise<unknown>) {
    try { setError(null); await action() } catch (e) { console.error(e); setError('No se pudo guardar el cambio. Revisa tu sesión y tu conexión.') }
  }
  return { clubs, loading, error, addClub, renameClub, deleteClub }
}
