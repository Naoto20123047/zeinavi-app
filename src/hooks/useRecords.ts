import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

// ── 型定義 ──────────────────────────────────────────────
export type IncomeType  = 'アルバイト' | '業務委託' | 'フリマ' | 'その他'
export type ExpenseType = '交通費' | '通信費' | '機材費' | '書籍費' | 'その他'

export interface IncomeRecord {
  id:     string
  type:   IncomeType
  amount: number
  from:   string
  date:   string
}

export interface ExpenseRecord {
  id:     string
  type:   ExpenseType
  amount: number
  memo:   string
  date:   string
}

// ── 収入記録フック ───────────────────────────────────────
export function useIncomes() {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const q = query(
      collection(db, 'users', uid, 'incomes'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as IncomeRecord[]
      setIncomes(data)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const addIncome = async (record: Omit<IncomeRecord, 'id'>) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'incomes'), {
      ...record,
      createdAt: serverTimestamp(),
    })
  }

  const deleteIncome = async (id: string) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'incomes', id))
  }

  return { incomes, loading, addIncome, deleteIncome }
}

// ── 経費記録フック ───────────────────────────────────────
export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const q = query(
      collection(db, 'users', uid, 'expenses'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ExpenseRecord[]
      setExpenses(data)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const addExpense = async (record: Omit<ExpenseRecord, 'id'>) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'expenses'), {
      ...record,
      createdAt: serverTimestamp(),
    })
  }

  const deleteExpense = async (id: string) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'expenses', id))
  }

  return { expenses, loading, addExpense, deleteExpense }
}