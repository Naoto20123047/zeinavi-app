// 診断の「いまの見込み」と結果画面の部品
import { formatYen, FILING_DEADLINE_FULL_LABEL, REFUND_LAST_DATE_LABEL } from '../../config/taxConfig'
import { NoteBlock } from '../../components/ui'
import type { DiagnosisOutcome, Line } from '../../types/diagnosis'

/** 見込みを一言で表す */
function headline(o: DiagnosisOutcome): { label: string; amount: string | null; tone: 'refund' | 'pay' | 'calm' | 'warn' } {
  if (o.status === 'outOfScope') return { label: 'このアプリでは判定できない内容があります', amount: null, tone: 'warn' }
  if (o.status === 'mustFile') {
    if (o.paymentAmount > 0) return { label: '納める見込み', amount: formatYen(o.paymentAmount), tone: 'pay' }
    if (o.refundAmount > 0) return { label: '申告が必要・戻る見込み', amount: formatYen(o.refundAmount), tone: 'refund' }
    return { label: '申告が必要な見込み', amount: null, tone: 'pay' }
  }
  if (o.status === 'refund') {
    if (o.refundUnknown && o.refundAmount === 0) return { label: '申告すると戻る見込み', amount: null, tone: 'refund' }
    return { label: '戻る見込み', amount: formatYen(o.refundAmount), tone: 'refund' }
  }
  return { label: '申告の義務はない見込み', amount: null, tone: 'calm' }
}

/** 診断中に出す「いまの見込み」。compact はスマホの下部に出す1行版 */
export function EstimatePanel({ outcome, compact }: { outcome: DiagnosisOutcome; compact?: boolean }) {
  const h = headline(outcome)
  const color =
    h.tone === 'refund' ? 'text-brand-600' :
    h.tone === 'pay'    ? 'text-navy-900'  :
    h.tone === 'warn'   ? 'text-warn-700'  : 'text-ink'

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3" aria-live="polite">
        <span className="text-[11.5px] text-muted flex-shrink-0">いまの見込み</span>
        <span className={`text-sm font-bold text-right ${color}`}>
          {h.amount ? <><span className="text-xs mr-1.5">{h.label}</span><span className="font-display text-lg tabular-nums">{h.amount}</span></> : h.label}
        </span>
      </div>
    )
  }

  return (
    <div className="card p-5 flex flex-col gap-4" aria-live="polite">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">いまの見込み</span>
        <span className={`text-sm font-bold ${color}`}>{h.label}</span>
        {h.amount && <span className={`font-display text-[32px] font-black tabular-nums leading-tight ${color}`}>{h.amount}</span>}
      </div>
      {outcome.status !== 'outOfScope' && (
        <dl className="flex flex-col gap-1.5 text-[13px] m-0 border-t border-sand-200 pt-3">
          <Row label="所得の合計" value={outcome.totalIncome} />
          <Row label="本来の所得税" value={outcome.estimatedTax} />
          <Row label="引かれた所得税" value={outcome.withheldTotal} />
        </dl>
      )}
      <p className="text-[11.5px] text-muted leading-relaxed m-0">答えるたびに計算し直します。最後まで答えると確定します。</p>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={strong ? 'font-bold' : 'text-muted'}>{label}</dt>
      <dd className={`m-0 tabular-nums ${strong ? 'font-bold' : ''}`}>{formatYen(value)}</dd>
    </div>
  )
}

function LineTable({ title, lines, total, totalLabel }: { title: string; lines: Line[]; total?: number; totalLabel?: string }) {
  if (lines.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold m-0">{title}</h3>
      <dl className="flex flex-col gap-1.5 text-[13px] m-0">
        {lines.map((l) => <Row key={l.label} label={l.label} value={l.value} />)}
        {total !== undefined && totalLabel && (
          <div className="border-t border-sand-200 pt-1.5"><Row label={totalLabel} value={total} strong /></div>
        )}
      </dl>
    </div>
  )
}

/** 結果のいちばん上の大きな表示 */
export function ResultHero({ outcome }: { outcome: DiagnosisOutcome }) {
  const o = outcome
  if (o.status === 'refund') {
    return (
      <div className="relative overflow-hidden rounded-[22px] bg-white border border-sand-300 p-6 md:p-8 flex flex-col gap-3">
        {/* 封筒のふたの形 */}
        <svg className="absolute inset-x-0 top-0 w-full h-16 text-brand-50" viewBox="0 0 400 64" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0h400L200 60z" fill="currentColor" />
        </svg>
        <span className="relative self-start inline-flex items-center h-7 px-3 rounded-full bg-brand-600 text-white text-xs font-bold">還付申告ができます</span>
        <p className="relative text-sm text-muted m-0">申告すると、払いすぎた所得税が戻ってきます</p>
        {o.refundAmount > 0 ? (
          <p className="relative font-display text-[44px] md:text-[56px] font-black text-brand-600 tabular-nums leading-none m-0">
            {formatYen(o.refundAmount)}
          </p>
        ) : (
          <p className="relative font-display text-2xl font-black text-brand-600 m-0">金額は書類で確定します</p>
        )}
        <span className="anim-stamp absolute right-5 bottom-5 md:right-8 md:bottom-8 w-20 h-20 rounded-full border-[3px] border-brand-600 text-brand-600 grid place-items-center rotate-[-12deg] font-display font-black text-sm">
          還付
        </span>
        <p className="relative text-xs text-muted m-0">申告できる期間：{REFUND_LAST_DATE_LABEL}まで</p>
      </div>
    )
  }
  if (o.status === 'mustFile') {
    return (
      <div className="rounded-[22px] bg-navy-900 text-white p-6 md:p-8 flex flex-col gap-3">
        <span className="self-start inline-flex items-center h-7 px-3 rounded-full bg-white text-navy-900 text-xs font-bold">確定申告が必要です</span>
        {o.paymentAmount > 0 && (
          <>
            <p className="text-sm text-slate-300 m-0">納める所得税の見込み</p>
            <p className="font-display text-[44px] md:text-[56px] font-black tabular-nums leading-none m-0">{formatYen(o.paymentAmount)}</p>
          </>
        )}
        {o.refundAmount > 0 && (
          <>
            <p className="text-sm text-slate-300 m-0">申告すると戻る所得税の見込み</p>
            <p className="font-display text-[44px] md:text-[56px] font-black tabular-nums leading-none m-0">{formatYen(o.refundAmount)}</p>
          </>
        )}
        <p className="text-xs text-slate-300 m-0">期限：{FILING_DEADLINE_FULL_LABEL}</p>
      </div>
    )
  }
  if (o.status === 'outOfScope') {
    return (
      <div className="rounded-[22px] bg-warn-50 border border-sand-300 p-6 md:p-8 flex flex-col gap-3">
        <span className="self-start inline-flex items-center h-7 px-3 rounded-full bg-warn-700 text-white text-xs font-bold">このアプリでは判定できません</span>
        <p className="text-sm leading-relaxed m-0">次の内容は計算のしかたが複雑なため、税務署や税理士に確認することをおすすめします。</p>
        <ul className="text-sm font-bold leading-relaxed m-0 pl-5 list-disc">
          {o.outOfScopeReasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>
    )
  }
  return (
    <div className="rounded-[22px] bg-white border border-sand-300 p-6 md:p-8 flex flex-col gap-3">
      <span className="self-start inline-flex items-center h-7 px-3 rounded-full bg-sand-200 text-ink text-xs font-bold">申告の義務はありません</span>
      <p className="font-display text-2xl md:text-3xl font-black leading-snug m-0">所得税の確定申告は、しなくてかまいません</p>
      <p className="text-sm text-muted leading-relaxed m-0">下の「ほかに確認すること」もあわせてご覧ください。</p>
    </div>
  )
}

/** 根拠・計算・確認事項 */
export function ResultDetails({ outcome }: { outcome: DiagnosisOutcome }) {
  const o = outcome
  const totalDeduction = o.deductionLines.reduce((s, l) => s + l.value, 0)
  return (
    <div className="flex flex-col gap-4">
      {o.reasons.length > 0 && o.status !== 'outOfScope' && (
        <section className="card p-5 flex flex-col gap-2">
          <h3 className="text-sm font-bold m-0">判定の根拠</h3>
          <ul className="text-[13.5px] leading-relaxed m-0 pl-5 list-disc">
            {o.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>
      )}

      {o.pending.length > 0 && (
        <section className="card p-5 flex flex-col gap-2">
          <h3 className="text-sm font-bold m-0">確認できると、より正確になること</h3>
          <p className="text-xs text-muted leading-relaxed m-0">「わからない」と答えた項目です。判定は、いちばん起こりやすい場合で計算しています。</p>
          <ul className="text-[13.5px] leading-relaxed m-0 pl-5 list-disc">
            {o.pending.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>
      )}

      {o.status !== 'outOfScope' && (
        <section className="card p-5 flex flex-col gap-5">
          <LineTable title="所得" lines={o.incomeLines} total={o.totalIncome} totalLabel="所得の合計" />
          <LineTable title="控除" lines={o.deductionLines} total={totalDeduction} totalLabel="控除の合計" />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold m-0">所得税</h3>
            <dl className="flex flex-col gap-1.5 text-[13px] m-0">
              <Row label="課税される所得" value={o.taxableIncome} />
              <Row label="本来の所得税（復興特別所得税を含む）" value={o.estimatedTax} />
              <Row label="引かれた所得税" value={o.withheldTotal} />
            </dl>
          </div>
        </section>
      )}

      {o.notes.length > 0 && (
        <section className="card p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold m-0">ほかに確認すること</h3>
          {o.notes.map((n) => <NoteBlock key={n.kind + n.title} tone={n.tone} title={n.title} body={n.body} />)}
        </section>
      )}

      <p className="text-[11.5px] text-muted leading-relaxed m-0">
        この結果は、入力された内容から計算した見込みです。実際の税額は、源泉徴収票などの書類の金額で決まります。
      </p>
    </div>
  )
}
