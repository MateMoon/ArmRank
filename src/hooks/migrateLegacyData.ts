import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { GENERAL_CLUB_ID } from './useArmwrestlers'

export async function migrateLegacyData(): Promise<'migrated' | 'already-migrated'> {
  const snapshot = await getDocs(collection(db, 'armwrestlers'))
  const legacy = snapshot.docs.filter((d) => Object.prototype.hasOwnProperty.call(d.data(), 'rankLeft') || Object.prototype.hasOwnProperty.call(d.data(), 'rankRight'))
  if (!legacy.length) return 'already-migrated'

  const backup = legacy.map((d) => ({ id: d.id, ...d.data() }))
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `respaldo-armwrestlers-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

  await writeBatch(db).set(doc(db, 'clubs', GENERAL_CLUB_ID), { name: 'Ranking general' }).commit()
  for (let i = 0; i < legacy.length; i += 249) {
    const batch = writeBatch(db)
    for (const athlete of legacy.slice(i, i + 249)) {
      const data = athlete.data()
      batch.set(doc(db, 'clubs', GENERAL_CLUB_ID, 'members', athlete.id), {
        rankLeft: Number.isInteger(data.rankLeft) ? data.rankLeft : null,
        rankRight: Number.isInteger(data.rankRight) ? data.rankRight : null,
      })
      batch.set(doc(db, 'armwrestlers', athlete.id), { name: String(data.name ?? '') })
    }
    await batch.commit()
  }
  return 'migrated'
}
