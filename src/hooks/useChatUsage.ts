import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { CHAT_DAILY_LIMIT } from '../config/taxConfig'

/**
 * AIチャットの1日あたり利用回数（users/{uid}/chatUsage/today）。
 *
 * 連続送信で更新が競合しないよう、読み書きはトランザクションでまとめる。
 * サーバーを持たない構成のため上限の強制はできない。Firestore ルール側で
 * 「同じ日付のあいだ count は1ずつしか増やせない」を設定して回避を防ぐこと。
 */
export function useChatUsage() {
  // undefined = 認証状態の確認中 / null = 未ログイン
  const [uid, setUid] = useState<string | null | undefined>(undefined)
  const [count, setCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null))
    return () => unsub()
  }, [])

  const todayStr = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  useEffect(() => {
    if (!uid) return

    const ref = doc(db, 'users', uid, 'chatUsage', 'today')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data()
        // 日付が変わっていれば 0 とみなす（書き込みは次回の加算時）
        setCount(data && data.date === todayStr ? (data.count ?? 0) : 0)
        setLoaded(true)
      },
      (error) => {
        console.error('利用回数の取得に失敗しました', error)
        setLoaded(true)
      }
    )
    return () => unsub()
  }, [uid, todayStr])

  /** 上限に達している場合は false を返し、書き込みは行わない */
  const increment = useCallback(async (): Promise<boolean> => {
    const currentUid = auth.currentUser?.uid
    if (!currentUid) return false

    const ref = doc(db, 'users', currentUid, 'chatUsage', 'today')
    try {
      return await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        const data = snap.exists() ? snap.data() : null
        const stored = data && data.date === todayStr ? (data.count ?? 0) : 0

        if (stored >= CHAT_DAILY_LIMIT) return false

        tx.set(ref, {
          date: todayStr,
          count: stored + 1,
          updatedAt: serverTimestamp(),
        })
        return true
      })
    } catch (error) {
      console.error('利用回数の更新に失敗しました', error)
      return false
    }
  }, [todayStr])

  const loading = uid === undefined || (uid !== null && !loaded)

  return {
    count,
    loading,
    increment,
    remaining: Math.max(CHAT_DAILY_LIMIT - count, 0),
    isLimit: count >= CHAT_DAILY_LIMIT,
    limit: CHAT_DAILY_LIMIT,
  }
}
