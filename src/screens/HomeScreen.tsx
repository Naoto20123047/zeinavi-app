// ホーム：プロフィールに合わせて、いちばん関係のある情報を上に出す
import { useMemo, useState } from 'react'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { trackEvent, AnalyticsEvents } from '../lib/analytics'
import { useIncomes, useExpenses } from '../hooks/useRecords'
import { useDiagnosisResults, RESULT_LABELS, type DiagnosisResult } from '../hooks/useDiagnosisResult'
import AppShell from '../components/AppShell'
import { Icons } from '../components/Icons'
import {
  TAX_YEAR,
  INCOME_BAR_LIMIT,
  FILING_DEADLINE_FULL_LABEL,
  FILING_RULES,
  formatMan,
  formatYen,
} from '../config/taxConfig'
import { daysUntilDeadline } from '../utils/dates'
import { diagnose } from '../utils/diagnose'
import { relevantWalls, isOver } from '../utils/walls'
import type { Profile } from '../types/profile'
import type { DiagnosisAnswers } from '../types/diagnosis'

// ── メニュー ─────────────────────────────────────────────
const MENU_ITEMS = [
  { icon: Icons.book,   label: 'ケース別ガイド',     sub: '申告の手順を状況別に', screen: 'guide'  },
  { icon: Icons.check,  label: '書類チェック',       sub: '必要な書類を確認',     screen: 'check'  },
  { icon: Icons.record, label: '収入・経費の記録',   sub: '毎月の入出金を記録',   screen: 'record' },
  { icon: Icons.chat,   label: 'AIに相談',           sub: '言葉の意味などを質問', screen: 'chat'   },
]

// ── パスワード変更 ────────────────────────────────────────
function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('すべての項目を入力してください'); return
    }
    if (newPassword.length < 6) {
      setError('新しいパスワードは6文字以上にしてください'); return
    }
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません'); return
    }
    const user = auth.currentUser
    if (!user?.email) {
      setError('ログイン情報を確認できませんでした'); return
    }
    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setSuccess(true)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      setError(code === 'auth/wrong-password' || code === 'auth/invalid-credential'
        ? '現在のパスワードが正しくありません'
        : 'パスワードの変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="pw-title" className="relative w-full md:max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 z-10">
        {success ? (
          <div className="flex flex-col gap-3 text-center py-2">
            <p className="font-bold">パスワードを変更しました</p>
            <p className="text-sm text-muted m-0">次回から新しいパスワードでログインしてください。</p>
            <button type="button" onClick={onClose} className="btn-primary mt-3">閉じる</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 id="pw-title" className="font-bold text-base m-0">パスワードを変更</h3>
            {([
              ['pw-cur', '現在のパスワード', currentPassword, setCurrentPassword, ''],
              ['pw-new', '新しいパスワード', newPassword, setNewPassword, '6文字以上'],
              ['pw-cfm', '新しいパスワード（確認）', confirmPassword, setConfirmPassword, 'もう一度入力'],
            ] as const).map(([id, label, value, set, ph]) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-xs text-muted">{label}</label>
                <input id={id} type="password" className="field" placeholder={ph} value={value} onChange={(e) => set(e.target.value)} />
              </div>
            ))}
            {error && <p className="text-warn-700 text-xs text-center m-0">{error}</p>}
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? '変更しています' : 'パスワードを変更する'}
            </button>
            <button type="button" onClick={onClose} className="text-muted text-sm py-2">キャンセル</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 給料の壁メーター（学生・扶養に入っている人・パート向け） ──
function WallMeter({ profile, salary, loading }: { profile: Profile; salary: number; loading: boolean }) {
  const walls = relevantWalls(profile)
  const limit = INCOME_BAR_LIMIT
  const nextWall = walls.find((w) => !isOver(w, salary))
  const pct = (v: number) => `${Math.min((v / limit) * 100, 100)}%`

  return (
    <section className="card p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold m-0">{TAX_YEAR}年の給料と「壁」</h2>
        <span className="text-[11.5px] text-muted">記録した給料から計算</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-[34px] font-black tabular-nums leading-tight">{loading ? '…' : formatYen(salary)}</span>
        <span className="text-[13px] text-muted">
          {nextWall
            ? <>次の壁（{nextWall.short}・{formatMan(nextWall.amount)}）まで あと<b className="text-ink tabular-nums">{formatYen(Math.max(nextWall.amount - salary, 0))}</b></>
            : '表示している壁はすべて超えています'}
        </span>
      </div>

      {/* メーター本体：壁の位置に目盛りを置く */}
      <div className="relative pt-1 pb-9" aria-hidden="true">
        <div className="h-3 rounded-full bg-sand-200 overflow-hidden">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: pct(salary) }} />
        </div>
        {walls.map((w, i) => (
          <div key={w.id} className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: pct(w.amount) }}>
            <span className={`w-0.5 h-5 ${isOver(w, salary) ? 'bg-navy-900' : 'bg-sand-500'}`} />
            <span className={`text-[10px] whitespace-nowrap mt-0.5 ${i % 2 ? 'translate-y-3.5' : ''} ${isOver(w, salary) ? 'text-navy-900 font-bold' : 'text-muted'}`}>
              {w.short}
            </span>
          </div>
        ))}
      </div>

      {nextWall && <p className="text-[12.5px] leading-relaxed text-muted m-0 border-t border-sand-200 pt-3">{nextWall.body}</p>}
    </section>
  )
}

// ── 給料以外の所得（会社員・フリーランスなど向け） ─────────
function SideIncomeCard({ income, loading }: { income: number; loading: boolean }) {
  const limit = FILING_RULES.sideIncomeExemption
  const over = income > limit
  return (
    <section className="card p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold m-0">給料以外の所得</h2>
        <span className="text-[11.5px] text-muted">記録から計算（収入−経費）</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-display text-[34px] font-black tabular-nums leading-tight ${over ? 'text-warn-700' : ''}`}>
          {loading ? '…' : formatYen(income)}
        </span>
        <span className="text-sm text-muted">／ {formatMan(limit)}</span>
      </div>
      <div className="h-3 rounded-full bg-sand-200 overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-warn-700' : 'bg-brand-600'}`} style={{ width: `${Math.min((income / limit) * 100, 100)}%` }} />
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted m-0">
        {over
          ? `${formatMan(limit)}を超えているため、会社員の人も確定申告が必要になる見込みです。`
          : `給料が1か所の人は、給料以外の所得が${formatMan(limit)}以下なら所得税の確定申告は不要です（住民税の申告は必要です）。`}
        フリマで自分の物を売った分は含めていません。
      </p>
    </section>
  )
}

/** 申告すると戻る可能性があるもの（会社員・パートなど向け） */
function RefundHints({ onNavigate }: { onNavigate: (s: string) => void }) {
  const items = [
    ['医療費が多かった', '家族の分も合わせて年10万円（または所得の5%）を超えた'],
    ['ふるさと納税をした', '6か所以上に寄付した、またはワンストップ特例を出していない'],
    ['年の途中で仕事をやめた', '12月までに次の勤務先で年末調整を受けていない'],
    ['住宅ローンを組んだ', '住み始めた最初の年'],
  ]
  return (
    <section className="card p-5 md:p-6 flex flex-col gap-3">
      <h2 className="text-sm font-bold m-0">申告すると戻る可能性があるもの</h2>
      <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
        {items.map(([t, s]) => (
          <li key={t} className="flex gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 flex-shrink-0" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-sm font-bold">{t}</span>
              <span className="text-xs text-muted leading-relaxed">{s}</span>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onNavigate('diagnose')} className="text-sm font-bold text-brand-600 self-start">
        当てはまるか診断で確かめる
      </button>
    </section>
  )
}

// ── 前回の診断結果 ───────────────────────────────────────
function LastResultCard({ result, profile, onNavigate }: {
  result: DiagnosisResult; profile: Profile; onNavigate: (s: string) => void
}) {
  // version 2 は回答から計算し直す（プロフィールの変更も反映される）
  const outcome = result.answers?.version === 2 ? diagnose(profile, result.answers as DiagnosisAnswers) : null
  const status = outcome?.status ?? result.resultType
  const amount =
    outcome && outcome.paymentAmount > 0 ? `納める見込み ${formatYen(outcome.paymentAmount)}` :
    outcome && outcome.refundAmount > 0  ? `戻る見込み ${formatYen(outcome.refundAmount)}` : null
  const date = result.createdAt.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })

  return (
    <section className="card p-5 md:p-6 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold m-0">前回の診断</h2>
        <span className="text-[11.5px] text-muted">{date}</span>
      </div>
      <p className="font-display text-xl font-black m-0">{RESULT_LABELS[status]}</p>
      {amount && <p className={`text-sm font-bold tabular-nums m-0 ${outcome?.paymentAmount ? 'text-navy-900' : 'text-brand-600'}`}>{amount}</p>}
      {!outcome && <p className="text-xs text-muted m-0">以前の形式の診断です。新しい診断では金額の見込みも出せます。</p>}
      <button type="button" onClick={() => onNavigate('diagnose')} className="btn-secondary mt-1">もう一度診断する</button>
    </section>
  )
}

/** 自分に関係する壁の一覧 */
function WallList({ profile }: { profile: Profile }) {
  const walls = relevantWalls(profile)
  return (
    <section className="card p-5 flex flex-col gap-3">
      <h2 className="text-sm font-bold m-0">あなたに関係する壁（給料の額）</h2>
      <dl className="flex flex-col m-0">
        {walls.map((w) => (
          <div key={w.id} className="flex justify-between gap-3 py-2.5 border-b border-sand-200 last:border-0">
            <dt className="text-sm">{w.short}</dt>
            <dd className="text-sm font-bold tabular-nums m-0">{formatMan(w.amount)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11.5px] text-muted leading-relaxed m-0">プロフィールの内容から選んでいます。</p>
    </section>
  )
}

function DiagnosisCTA({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate('diagnose')}
      className="w-full rounded-[22px] bg-navy-900 text-white p-5 md:p-6 text-left flex items-center gap-4 hover:bg-navy-800 transition-colors"
    >
      <span className="w-12 h-12 rounded-2xl bg-brand-600 grid place-items-center flex-shrink-0">{Icons.diagnose}</span>
      <span className="flex-1 flex flex-col gap-0.5">
        <span className="text-xs text-slate-300">まずはここから</span>
        <span className="font-display text-lg font-black leading-snug">確定申告が必要か、いくら戻るかを診断する</span>
        <span className="text-xs text-slate-300">答えるたびに見込み額が出ます・5〜10分</span>
      </span>
      <span className="text-slate-300">{Icons.arrow}</span>
    </button>
  )
}

function DeadlineCard() {
  return (
    <section className="card p-5 flex md:hidden items-center gap-4">
      <span className="w-11 h-11 rounded-2xl bg-sand-200 grid place-items-center text-navy-900 flex-shrink-0">{Icons.clock}</span>
      <div className="flex flex-col">
        <span className="text-xs text-muted">申告期限まで</span>
        <span className="font-display text-2xl font-black tabular-nums leading-tight">{daysUntilDeadline()}<span className="text-sm ml-0.5">日</span></span>
        <span className="text-[11.5px] text-muted">{FILING_DEADLINE_FULL_LABEL}</span>
      </div>
    </section>
  )
}

function MenuGrid({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-bold text-muted m-0 px-1">メニュー</h2>
      <div className="grid grid-cols-2 gap-3">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
            className="card p-4 flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3 text-left hover:bg-sand-50 transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center flex-shrink-0">{item.icon}</span>
            <span className="flex flex-col">
              <span className="text-sm font-bold">{item.label}</span>
              <span className="text-[11.5px] text-muted">{item.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

// ── 本体 ────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, profile }: {
  onNavigate: (screen: string) => void
  profile: Profile
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { incomes, loading: incomesLoading } = useIncomes()
  const { expenses } = useExpenses()
  const { latestResult } = useDiagnosisResults()

  const isGoogleUser = auth.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false
  const handleSignOut = async () => {
    trackEvent(AnalyticsEvents.logout)
    await auth.signOut()
  }

  // 給料の壁を中心に見せる人：学生、家族の扶養に入っている人、パート・アルバイト
  const showWalls =
    profile.role === 'student' ||
    profile.role === 'partTime' ||
    profile.dependentOf === 'parent' ||
    profile.dependentOf === 'spouse' ||
    !profile.role

  const { salary, sideIncome } = useMemo(() => {
    const salary = incomes.filter((r) => r.type === 'アルバイト').reduce((s, r) => s + r.amount, 0)
    const sideRevenue = incomes.filter((r) => r.type === '業務委託' || r.type === 'その他').reduce((s, r) => s + r.amount, 0)
    const expenseTotal = expenses.reduce((s, r) => s + r.amount, 0)
    return { salary, sideIncome: Math.max(sideRevenue - expenseTotal, 0) }
  }, [incomes, expenses])

  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })

  const main = showWalls
    ? <WallMeter profile={profile} salary={salary} loading={incomesLoading} />
    : <SideIncomeCard income={sideIncome} loading={incomesLoading} />

  return (
    <AppShell
      active="home"
      onNavigate={onNavigate}
      onPasswordChange={isGoogleUser ? undefined : () => setShowPasswordModal(true)}
    >
      {/* スマホの上部 */}
      <header className="md:hidden bg-navy-900 text-white px-5 pt-12 pb-6 flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11.5px] text-slate-300">{TAX_YEAR}年分（令和8年分）</span>
          <span className="font-display text-2xl font-black">確定申告ナビ</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onNavigate('profile')} aria-label="プロフィールを変更"
            className="w-10 h-10 rounded-xl bg-navy-800 grid place-items-center text-slate-300">
            {Icons.user}
          </button>
          {!isGoogleUser && (
            <button type="button" onClick={() => setShowPasswordModal(true)} aria-label="パスワードを変更"
              className="w-10 h-10 rounded-xl bg-navy-800 grid place-items-center text-slate-300">
              {Icons.key}
            </button>
          )}
          <button type="button" onClick={handleSignOut} aria-label="ログアウト"
            className="w-10 h-10 rounded-xl bg-navy-800 grid place-items-center text-slate-300">
            {Icons.logout}
          </button>
        </div>
      </header>

      {/* PCの上部 */}
      <header className="hidden md:flex items-end justify-between px-12 pt-10 pb-2 max-w-[1120px] w-full mx-auto">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{today}</span>
          <h1 className="font-display text-[28px] font-black m-0">ホーム</h1>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-12 pt-4 md:pt-6 pb-8 max-w-[1120px] w-full mx-auto flex flex-col gap-4">
        {!profile.onboardingDone && (
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="card p-4 text-left flex items-center gap-3 border-brand-600"
          >
            <span className="flex-1 flex flex-col gap-0.5">
              <span className="text-sm font-bold">プロフィールを登録してください</span>
              <span className="text-xs text-muted">学生かどうかや扶養の状況に合わせて、表示と診断が正確になります。1分ほどで終わります。</span>
            </span>
            <span className="text-muted">{Icons.arrow}</span>
          </button>
        )}

        <div className="md:grid md:grid-cols-[1fr_340px] md:gap-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 min-w-0">
            {!latestResult && <DiagnosisCTA onNavigate={onNavigate} />}
            {main}
            <MenuGrid onNavigate={onNavigate} />
          </div>
          <div className="flex flex-col gap-4">
            {latestResult && <LastResultCard result={latestResult} profile={profile} onNavigate={onNavigate} />}
            {showWalls ? <WallList profile={profile} /> : <RefundHints onNavigate={onNavigate} />}
            <DeadlineCard />
          </div>
        </div>

        <p className="text-[11.5px] text-muted text-center leading-relaxed pt-2 m-0">
          このアプリの情報は参考情報です。最終的な判断は、税務署または税理士にご確認ください。
        </p>
      </main>

      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
    </AppShell>
  )
}
