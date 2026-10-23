import { useEffect, useState } from 'react'
import { collection, collectionGroup, doc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

export type Arm = 'left' | 'right'
export interface Armwrestler { id: string; name: string }
export interface ClubMember extends Armwrestler { rankLeft: number | null; rankRight: number | null }
export interface Club { id: string; name: string }
export const GENERAL_CLUB_ID = 'general'
export const rankKey = (arm: Arm) => arm === 'left' ? 'rankLeft' : 'rankRight'

export function useArmwrestlers() {
  const [items, setItems] = useState<Armwrestler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => onSnapshot(collection(db, 'armwrestlers'), (snap) => {
    setItems(snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? '') })))
    setLoading(false)
  }, (err) => { console.error(err); setError('No se pudo cargar la lista de atletas.'); setLoading(false) }), [])

  const createArmwrestler = async (name: string, clubId?: string) => {
    const id = doc(collection(db, 'armwrestlers')).id
    const batch = writeBatch(db)
    batch.set(doc(db, 'armwrestlers', id), { name: name.trim() })
    batch.set(doc(db, 'clubs', GENERAL_CLUB_ID, 'members', id), { rankLeft: null, rankRight: null })
    if (clubId && clubId !== GENERAL_CLUB_ID) batch.set(doc(db, 'clubs', clubId, 'members', id), { rankLeft: null, rankRight: null })
    try { await batch.commit(); setError(null) } catch (e) { console.error(e); setError('No se pudo guardar el atleta. Revisa tu sesión y tu conexión.') }
  }
  const renameArmwrestler = async (id: string, name: string) => {
    try { await writeBatch(db).update(doc(db, 'armwrestlers', id), { name: name.trim() }).commit(); setError(null) }
    catch (e) { console.error(e); setError('No se pudo guardar el cambio. Revisa tu sesión y tu conexión.') }
  }
  const deleteArmwrestler = async (id: string) => {
    try {
      const snap = await getMemberDocsForAthlete(id)
      for (let i = 0; i < snap.length; i += 499) {
        const batch = writeBatch(db)
        snap.slice(i, i + 499).forEach((d) => batch.delete(d))
        if (i + 499 >= snap.length) batch.delete(doc(db, 'armwrestlers', id))
        await batch.commit()
      }
      if (!snap.length) await writeBatch(db).delete(doc(db, 'armwrestlers', id)).commit()
      setError(null)
    } catch (e) { console.error(e); setError('No se pudo eliminar el atleta. Revisa tu sesión y tu conexión.') }
  }
  return { items, loading, error, setError, createArmwrestler, renameArmwrestler, deleteArmwrestler }
}

async function getMemberDocsForAthlete(id: string) {
  const snap = await getDocs(collectionGroup(db, 'members'))
  return snap.docs.filter((d) => d.id === id).map((d) => d.ref)
}
