import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { GENERAL_CLUB_ID, rankKey, type Arm, type Armwrestler, type ClubMember } from './useArmwrestlers'

type MemberData = { id: string; rankLeft: number | null; rankRight: number | null }
const empty = (id: string): MemberData => ({ id, rankLeft: null, rankRight: null })

function place(list: MemberData[], id: string, arm: Arm, pos: number | null) {
  const k = rankKey(arm)
  const order = list.filter((m) => m.id !== id && m[k] !== null).sort((a, b) => a[k]! - b[k]!).map((m) => m.id)
  if (pos !== null) order.splice(Math.max(0, Math.min(order.length, Math.floor(pos) - 1)), 0, id)
  return list.map((m) => ({ ...m, [k]: order.indexOf(m.id) < 0 ? null : order.indexOf(m.id) + 1 }))
}

export function useClubMembers(clubId: string, athletes: Armwrestler[]) {
  const [members, setMembers] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setLoading(true)
    return onSnapshot(collection(db, 'clubs', clubId, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, rankLeft: d.data().rankLeft ?? null, rankRight: d.data().rankRight ?? null })))
      setLoading(false)
    }, (err) => { console.error(err); setError('No se pudo cargar el ranking.'); setLoading(false) })
  }, [clubId])

  const rows = useMemo(() => {
    const names = new Map(athletes.map((a) => [a.id, a.name]))
    return members.filter((m) => names.has(m.id)).map((m) => ({ ...m, name: names.get(m.id)! })) as ClubMember[]
  }, [members, athletes])

  const commit = useCallback(async (next: MemberData[]) => {
    const prevMap = new Map(members.map((m) => [m.id, m]))
    const nextMap = new Map(next.map((m) => [m.id, m]))
    const batch = writeBatch(db)
    for (const m of next) {
      const p = prevMap.get(m.id)
      if (!p || p.rankLeft !== m.rankLeft || p.rankRight !== m.rankRight) batch.set(doc(db, 'clubs', clubId, 'members', m.id), { rankLeft: m.rankLeft, rankRight: m.rankRight })
    }
    for (const m of members) if (!nextMap.has(m.id)) batch.delete(doc(db, 'clubs', clubId, 'members', m.id))
    try { setError(null); await batch.commit() } catch (e) { console.error(e); setError('No se pudo guardar el cambio. Revisa tu sesión y tu conexión.') }
  }, [clubId, members])

  const getRanking = useCallback((arm: Arm) => rows.filter((m) => m[rankKey(arm)] !== null).sort((a, b) => a[rankKey(arm)]! - b[rankKey(arm)]!), [rows])
  const getUnranked = useCallback((arm: Arm) => rows.filter((m) => m[rankKey(arm)] === null).sort((a, b) => a.name.localeCompare(b.name)), [rows])
  const addToClub = async (id: string, rankLeft: number | null = null, rankRight: number | null = null) => {
    if (members.some((m) => m.id === id)) return
    let next = [...members, { id, rankLeft: null, rankRight: null }]
    next = place(next, id, 'left', rankLeft)
    next = place(next, id, 'right', rankRight)
    await commit(next)
  }
  const removeFromClub = async (id: string) => {
    if (clubId === GENERAL_CLUB_ID) return
    const next = members.filter((m) => m.id !== id)
    for (const arm of ['left', 'right'] as Arm[]) {
      const k = rankKey(arm)
      const ids = next.filter((m) => m[k] !== null).sort((a, b) => a[k]! - b[k]!).map((m) => m.id)
      next.forEach((m) => { m[k] = ids.indexOf(m.id) < 0 ? null : ids.indexOf(m.id) + 1 })
    }
    await commit(next)
  }
  const setRank = async (id: string, arm: Arm, pos: number | null) => await commit(place(members, id, arm, pos))
  const reorderRank = async (id: string, arm: Arm, direction: 'up' | 'down') => {
    const k = rankKey(arm)
    const ordered = members.filter((m) => m[k] !== null).sort((a, b) => a[k]! - b[k]!)
    const i = ordered.findIndex((m) => m.id === id)
    const j = i + (direction === 'up' ? -1 : 1)
    if (i < 0 || j < 0 || j >= ordered.length) return
    const next = [...ordered]; [next[i], next[j]] = [next[j], next[i]]
    const ranks = new Map(next.map((m, index) => [m.id, index + 1]))
    await commit(members.map((m) => ranks.has(m.id) ? { ...m, [k]: ranks.get(m.id)! } : m))
  }
  const rankNewMember = (id: string) => addToClub(id)
  return { rows, loading, error, members, getRanking, getUnranked, addToClub, removeFromClub, setRank, reorderRank, rankNewMember }
}
