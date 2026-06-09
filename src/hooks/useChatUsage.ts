import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

const MAX = 10

export function useChatUsage() {
  const [count,   setCount]   = useState(0)
  const [loading, setLoading] = useState(true)

  const todayStr = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) { setLoading(false); return }

    const ref = doc(db, 'users', uid, 'chatUsage', 'today')
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        // 日付が今日と一致する場合のみカウントを復元
        if (data.date === todayStr) {
          setCount(data.count ?? 0)
        } else {
          // 日付が変わっていたらリセット
          setDoc(ref, { date: todayStr, count: 0 })
          setCount(0)
        }
      } else {
        setDoc(ref, { date: todayStr, count: 0 })
        setCount(0)
      }
    }).finally(() => setLoading(false))
  }, [])

  const increment = async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const newCount = count + 1
    setCount(newCount)
    const ref = doc(db, 'users', uid, 'chatUsage', 'today')
    await setDoc(ref, { date: todayStr, count: newCount })
  }

  return { count, loading, increment, remaining: MAX - count, isLimit: count >= MAX }
}