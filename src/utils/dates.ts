import { FILING_DEADLINE_DATE } from '../config/taxConfig'

/** 申告期限までの日数（端末の時計を使うため目安） */
export function daysUntilDeadline(now: Date = new Date()): number {
  const ms = FILING_DEADLINE_DATE.getTime() - now.getTime()
  return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0)
}
