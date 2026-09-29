import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../lib/firebase'

// ── フック ───────────────────────────────────────────────
export function useChecklist() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)
  const [uid, setUid]               = useState<string | null>(null)

  // 認証状態が確定してからuidをセット
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })
    return () => unsub()
  }, [])

  // Firestoreからチェック状態を読み込む
  useEffect(() => {
    if (!uid) return

    const load = async () => {
      const ref  = doc(db, 'users', uid, 'checklistState', 'state')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        setCheckedIds(new Set(data.checkedIds ?? []))
      }
      setLoading(false)
    }

    load()
  }, [uid])

  // Firestoreにチェック状態を保存
  const save = async (ids: Set<string>) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'checklistState', 'state')
    await setDoc(ref, { checkedIds: Array.from(ids) })
  }

  // チェックの切り替え
  const toggle = async (id: string) => {
    const next = new Set(checkedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setCheckedIds(next)
    await save(next)
  }

  // リセット
  const reset = async () => {
    const empty = new Set<string>()
    setCheckedIds(empty)
    await save(empty)
  }

  return { checkedIds, loading, toggle, reset }
}