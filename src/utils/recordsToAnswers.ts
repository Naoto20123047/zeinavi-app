// 収入・経費の記録を集計し、診断の回答の下書きに変換する
import type { IncomeRecord, ExpenseRecord } from '../hooks/useRecords'
import { newEmployer, type DiagnosisAnswers, type IncomeKind, type JobCount } from '../types/diagnosis'

export interface RecordTotal {
  total: number
  count: number
}

export interface RecordSummary {
  year:      number
  /** アルバイト：振り込み元ごとの合計 */
  partTime:  RecordTotal & { sources: { name: string; total: number }[] }
  freelance: RecordTotal
  flea:      RecordTotal
  other:     RecordTotal
  expense:   RecordTotal
  /** 対象の年以外、または日付が読めずに除いた件数 */
  skipped:   number
}

/** 記録の日付（例：2026/10/8、2026-10-08）から年を取り出す */
export function recordYear(date: string | undefined): number | null {
  const m = /^(\d{4})[/-]/.exec((date ?? '').trim())
  return m ? Number(m[1]) : null
}

const amountOf = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0)
const empty = (): RecordTotal => ({ total: 0, count: 0 })

export function summarizeRecords(incomes: IncomeRecord[], expenses: ExpenseRecord[], year: number): RecordSummary {
  const s: RecordSummary = {
    year,
    partTime: { ...empty(), sources: [] },
    freelance: empty(),
    flea: empty(),
    other: empty(),
    expense: empty(),
    skipped: 0,
  }
  const sources = new Map<string, number>()

  for (const r of incomes) {
    if (recordYear(r.date) !== year) { s.skipped++; continue }
    const amount = amountOf(r.amount)
    const bucket =
      r.type === 'アルバイト' ? s.partTime :
      r.type === '業務委託' ? s.freelance :
      r.type === 'フリマ' ? s.flea : s.other
    bucket.total += amount
    bucket.count++
    if (r.type === 'アルバイト') {
      const name = (r.from ?? '').trim() || '振り込み元の記録なし'
      sources.set(name, (sources.get(name) ?? 0) + amount)
    }
  }
  for (const r of expenses) {
    if (recordYear(r.date) !== year) { s.skipped++; continue }
    s.expense.total += amountOf(r.amount)
    s.expense.count++
  }
  s.partTime.sources = [...sources.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((x, y) => y.total - x.total)
  return s
}

export function hasRecords(s: RecordSummary): boolean {
  return s.partTime.count + s.freelance.count + s.flea.count + s.other.count + s.expense.count > 0
}

/**
 * 記録から回答の下書きを作る。どの質問も画面で確認・修正してもらう前提で、
 * 意味があいまいなもの（フリマ・その他）は自動では選ばない。
 */
export function applyRecords(base: DiagnosisAnswers, s: RecordSummary): DiagnosisAnswers {
  const a: DiagnosisAnswers = { ...base, fromRecords: true }
  const kinds = new Set<IncomeKind>(a.incomeKinds)

  if (s.partTime.count > 0) {
    kinds.add('salary')
    const n = s.partTime.sources.length
    const jobCount: JobCount = n <= 1 ? '1' : n === 2 ? '2' : '3+'
    a.jobCount = jobCount
    a.employers = s.partTime.sources.map((src, i) => ({ ...newEmployer(i), name: src.name, salary: src.total }))
  }
  if (s.freelance.count > 0) {
    kinds.add('freelance')
    a.freelanceRevenue = s.freelance.total
    // 経費の記録は、業務委託の経費として扱う（画面で確認してもらう）
    a.freelanceExpense = s.expense.total
  }
  a.incomeKinds = [...kinds]
  if (a.incomeKinds.length > 0) a.noIncome = false
  return a
}
