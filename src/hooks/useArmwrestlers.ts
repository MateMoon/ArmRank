import { useCallback, useEffect, useState } from 'react'
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

export type Arm = 'left' | 'right'

export interface Armwrestler {
  id: string
  name: string
  rankLeft: number | null
  rankRight: number | null
}

const COLLECTION = 'armwrestlers'

const key = (arm: Arm) => (arm === 'left' ? 'rankLeft' : 'rankRight')

// Coloca a `id` en `pos` (1-based) o lo deja sin clasificar (null) y compacta los rangos a 1..n.
function placeInArm(list: Armwrestler[], id: string, arm: Arm, pos: number | null): Armwrestler[] {
  const k = key(arm)
  const others = list
    .filter((a) => a.id !== id && a[k] !== null)
    .sort((a, b) => (a[k] as number) - (b[k] as number))
    .map((a) => a.id)
  if (pos !== null) {
    const idx = Math.max(0, Math.min(others.length, Math.floor(pos) - 1))
    others.splice(idx, 0, id)
  }
  return list.map((a) => {
    const i = others.indexOf(a.id)
    return { ...a, [k]: i === -1 ? null : i + 1 }
  })
}

// Deja los rangos de ambos brazos como 1..n sin huecos.
function compact(list: Armwrestler[]): Armwrestler[] {
  let next = list
  for (const arm of ['left', 'right'] as Arm[]) {
    const k = key(arm)
    const order = next
      .filter((a) => a[k] !== null)
      .sort((a, b) => (a[k] as number) - (b[k] as number))
      .map((a) => a.id)
    next = next.map((a) => {
      const i = order.indexOf(a.id)
      return { ...a, [k]: i === -1 ? null : i + 1 }
    })
  }
  return next
}

// Compara la lista anterior con la nueva y escribe en Firestore solo lo que cambió,
// todo en una sola operación atómica (o se guardan todos los cambios o ninguno).
async function saveChanges(prev: Armwrestler[], next: Armwrestler[]) {
  const batch = writeBatch(db)
  const prevById = new Map(prev.map((a) => [a.id, a]))
  const nextIds = new Set(next.map((a) => a.id))

  for (const a of next) {
    const p = prevById.get(a.id)
    if (!p || p.name !== a.name || p.rankLeft !== a.rankLeft || p.rankRight !== a.rankRight) {
      const { id, ...data } = a
      batch.set(doc(db, COLLECTION, id), data)
    }
  }
  for (const p of prev) {
    if (!nextIds.has(p.id)) batch.delete(doc(db, COLLECTION, p.id))
  }
  await batch.commit()
}

/**
 * Capa de datos con Firestore. Mantiene la misma interfaz pública que la versión
 * con localStorage, así que los componentes no cambian.
 */
export function useArmwrestlers() {
  const [items, setItems] = useState<Armwrestler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Escucha la colección en tiempo real: cualquier cambio se refleja en todos los visitantes.
  useEffect(() => {
    return onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Armwrestler, 'id'>) })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('No se pudo cargar el ranking.')
        setLoading(false)
      },
    )
  }, [])

  const commit = useCallback(async (prev: Armwrestler[], next: Armwrestler[]) => {
    try {
      setError(null)
      await saveChanges(prev, next)
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar el cambio. Revisa tu sesión y tu conexión.')
    }
  }, [])

  const getRanking = useCallback(
    (arm: Arm) => {
      const k = key(arm)
      return items.filter((a) => a[k] !== null).sort((a, b) => (a[k] as number) - (b[k] as number))
    },
    [items],
  )

  const getUnranked = useCallback(
    (arm: Arm) => items.filter((a) => a[key(arm)] === null).sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  )

  const addArmwrestler = useCallback(
    async (data: Omit<Armwrestler, 'id'>) => {
      const id = doc(collection(db, COLLECTION)).id // id automático de Firestore
      let next: Armwrestler[] = [...items, { id, name: data.name.trim(), rankLeft: null, rankRight: null }]
      next = placeInArm(next, id, 'left', data.rankLeft)
      next = placeInArm(next, id, 'right', data.rankRight)
      await commit(items, next)
    },
    [items, commit],
  )

  const removeArmwrestler = useCallback(
    async (id: string) => {
      await commit(items, compact(items.filter((a) => a.id !== id)))
    },
    [items, commit],
  )

  // Actualiza nombre y/o rangos. Un rango numérico inserta y desplaza; null lo deja sin clasificar.
  const updateArmwrestler = useCallback(
    async (id: string, patch: Partial<Omit<Armwrestler, 'id'>>) => {
      let next = items.map((a) => (a.id === id && patch.name !== undefined ? { ...a, name: patch.name.trim() } : a))
      if (patch.rankLeft !== undefined) next = placeInArm(next, id, 'left', patch.rankLeft)
      if (patch.rankRight !== undefined) next = placeInArm(next, id, 'right', patch.rankRight)
      await commit(items, next)
    },
    [items, commit],
  )

  // Intercambia posición con el vecino inmediato.
  const reorderRank = useCallback(
    async (id: string, arm: Arm, direction: 'up' | 'down') => {
      const k = key(arm)
      const cur = items.find((a) => a.id === id)
      if (!cur || cur[k] === null) return
      const target = (cur[k] as number) + (direction === 'up' ? -1 : 1)
      const neighbor = items.find((a) => a[k] === target)
      if (!neighbor) return
      const next = items.map((a) =>
        a.id === cur.id ? { ...a, [k]: target } : a.id === neighbor.id ? { ...a, [k]: cur[k] } : a,
      )
      await commit(items, next)
    },
    [items, commit],
  )

  return { items, loading, error, getRanking, getUnranked, addArmwrestler, removeArmwrestler, updateArmwrestler, reorderRank }
}
