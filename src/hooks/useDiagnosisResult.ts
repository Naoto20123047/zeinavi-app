import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../lib/firebase'

// ── 型定義 ──────────────────────────────────────────────
export type ResultType =
  | 'noNeed'
  | 'refund'
  | 'refundDeduction'
  | 'needMultiJob'
  | 'needSideIncome'
  | 'gray'

export interface DiagnosisAnswers {
  schoolType:      string
  enrollment:      string
  incomeTypes:     string[]
  jobCount:        string
  yearEndAdj:      string
  salaryRange:     string
  sideIncome:      string
  healthInsurance: string
  taxDependent:    string
  deductions:      string[]
  workerStudent:   string
}

export interface DiagnosisResult {
  id:         string
  resultType: ResultType
  answers:    DiagnosisAnswers
  createdAt:  Date
}

// ── フック ───────────────────────────────────────────────
export function useDiagnosisResults() {
  const [results, setResults] = useState<DiagnosisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [uid, setUid]         = useState<string | null>(null)

  // 認証状態が確定してからuidをセット
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })
    return () => unsub()
  }, [])

  // Firestoreを購読（最新10件）
  useEffect(() => {
    if (!uid) return

    const q = query(
      collection(db, 'users', uid, 'diagnosisResults'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
      })) as DiagnosisResult[]
      setResults(data)
      setLoading(false)
    })

    return () => unsub()
  }, [uid])

  // 診断結果を保存
  const saveResult = async (
    resultType: ResultType,
    answers: DiagnosisAnswers
  ) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'diagnosisResults'), {
      resultType,
      answers,
      createdAt: serverTimestamp(),
    })
  }

  // 最新の診断結果
  const latestResult = results[0] ?? null

  return { results, latestResult, loading, saveResult }
}