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
import type { DiagnosisAnswers, OutcomeStatus } from '../types/diagnosis'

// ── 型定義 ──────────────────────────────────────────────
/** 旧バージョン（version なし）の結果種別。履歴の表示のために残す */
export type LegacyResultType =
  | 'noNeed'
  | 'refund'
  | 'refundDeduction'
  | 'needMultiJob'
  | 'needSideIncome'
  | 'gray'

export type ResultType = OutcomeStatus | LegacyResultType

export interface DiagnosisResult {
  id:         string
  resultType: ResultType
  /** version: 2 のものは新しい形式。旧形式は中身を使わない */
  answers:    Partial<DiagnosisAnswers> & { version?: number }
  createdAt:  Date
}

/** 結果種別の表示名（旧形式も含む） */
export const RESULT_LABELS: Record<ResultType, string> = {
  mustFile:        '確定申告が必要です',
  refund:          '還付申告ができます',
  noNeed:          '申告の義務はありません',
  outOfScope:      'このアプリでは判定できません',
  refundDeduction: '還付申告ができます',
  needMultiJob:    '確定申告が必要です',
  needSideIncome:  '確定申告が必要です',
  gray:            '専門家への相談をおすすめします',
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

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() ?? new Date(),
        })) as DiagnosisResult[]
        setResults(data)
        setLoading(false)
      },
      () => setLoading(false),
    )

    return () => unsub()
  }, [uid])

  // 診断結果を保存（金額などは回答から再計算できるため、回答そのものを保存する）
  const saveResult = async (resultType: OutcomeStatus, answers: DiagnosisAnswers) => {
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
