import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { EMPTY_PROFILE, normalizeEnrollment, type Profile } from '../types/profile'

// プロフィールは users/{uid}/profile/main に1件だけ保存する
// ※ Firestore のセキュリティルールで「本人だけ読み書きできる」ようにしておくこと
export function useProfile() {
  const [uid, setUid]         = useState<string | null>(auth.currentUser?.uid ?? null)
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'profile', 'main')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as Partial<Profile> | undefined
        const merged = { ...EMPTY_PROFILE, ...(data ?? {}) }
        setProfile({ ...merged, enrollment: normalizeEnrollment(merged.enrollment) })
        setLoading(false)
      },
      (e) => {
        // 読めない場合も画面は止めず、未設定として扱う
        console.error('プロフィールの読み込みに失敗しました', e)
        setError('プロフィールを読み込めませんでした')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [uid])

  const saveProfile = async (next: Profile) => {
    setProfile(next)
    if (!uid) return
    await setDoc(
      doc(db, 'users', uid, 'profile', 'main'),
      { ...next, updatedAt: serverTimestamp() },
      { merge: true },
    )
  }

  return { profile, loading, error, saveProfile }
}
