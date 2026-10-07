// 画面共通の小さな部品
import type { ReactNode } from 'react'

const CheckMark = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

/** 1つだけ選ぶ選択肢 */
export function RadioChoice({ label, sub, selected, onClick, muted }: {
  label: string; sub?: string; selected: boolean; onClick: () => void; muted?: boolean
}) {
  return (
    <button type="button" className="choice" aria-pressed={selected} onClick={onClick}>
      <span className={`w-6 h-6 rounded-full flex-shrink-0 grid place-items-center ${selected ? 'bg-brand-600' : 'border-2 border-sand-500'}`}>
        {selected && <CheckMark />}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className={`text-[15px] ${muted ? 'font-medium' : 'font-bold'}`}>{label}</span>
        {sub && <span className="text-xs text-muted font-normal leading-relaxed">{sub}</span>}
      </span>
    </button>
  )
}

/** 複数選べる選択肢 */
export function CheckChoice({ label, sub, checked, onClick }: {
  label: string; sub?: string; checked: boolean; onClick: () => void
}) {
  return (
    <button type="button" className="choice" aria-checked={checked} role="checkbox" onClick={onClick}>
      <span className={`w-6 h-6 rounded-md flex-shrink-0 grid place-items-center ${checked ? 'bg-brand-600' : 'border-2 border-sand-500'}`}>
        {checked && <CheckMark />}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[15px] font-bold">{label}</span>
        {sub && <span className="text-xs text-muted font-normal leading-relaxed">{sub}</span>}
      </span>
    </button>
  )
}

/** はい／いいえ／わからない */
export function YesNoUnknownChoices({ value, onChange, yes = 'はい', no = 'いいえ', unknown = 'わからない', yesSub, noSub }: {
  value: string
  onChange: (v: 'yes' | 'no' | 'unknown') => void
  yes?: string; no?: string; unknown?: string; yesSub?: string; noSub?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <RadioChoice label={yes} sub={yesSub} selected={value === 'yes'} onClick={() => onChange('yes')} />
      <RadioChoice label={no} sub={noSub} selected={value === 'no'} onClick={() => onChange('no')} />
      <RadioChoice label={unknown} selected={value === 'unknown'} onClick={() => onChange('unknown')} muted />
    </div>
  )
}

/** 金額入力（カンマ区切りで表示） */
export function YenField({ id, label, sub, value, onChange, placeholder = '0' }: {
  id: string; label: string; sub?: string; value: number; onChange: (v: number) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      {sub && <span className="text-xs text-muted leading-relaxed">{sub}</span>}
      <div className="relative">
        <input
          id={id}
          className="field text-right pr-10 tabular-nums"
          inputMode="numeric"
          placeholder={placeholder}
          value={value ? value.toLocaleString('ja-JP') : ''}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d]/g, ''))
            onChange(Number.isFinite(n) ? n : 0)
          }}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">円</span>
      </div>
    </div>
  )
}

/** 折りたたみの説明 */
export function HelpBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="card px-4 py-3">
      <summary className="text-sm font-bold text-brand-600 cursor-pointer">{title}</summary>
      <div className="mt-2 text-[13px] leading-relaxed text-ink">{children}</div>
    </details>
  )
}

/** 進み具合のバー */
export function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1.5 rounded-full bg-sand-300 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
      <div className="h-full bg-navy-900 transition-all" style={{ width: `${Math.min((current / total) * 100, 100)}%` }} />
    </div>
  )
}

/** 情報・注意のラベル付きブロック */
export function NoteBlock({ tone, title, body }: { tone: 'info' | 'warn'; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`self-start inline-flex items-center h-[22px] px-2.5 rounded-full text-[11px] font-bold ${
        tone === 'warn' ? 'bg-warn-50 text-warn-700' : 'bg-brand-50 text-brand-600'
      }`}>{title}</span>
      <p className="text-[13.5px] leading-relaxed m-0">{body}</p>
    </div>
  )
}
