import { useState } from 'react'
import { auth } from '../../lib/firebase'

// ── 型定義 ──────────────────────────────────────────────
interface Answers {
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

const INITIAL_ANSWERS: Answers = {
  schoolType: '', enrollment: '', incomeTypes: [], jobCount: '',
  yearEndAdj: '', salaryRange: '', sideIncome: '', healthInsurance: '',
  taxDependent: '', deductions: [], workerStudent: '',
}

// ── 診断結果の計算 ───────────────────────────────────────
type ResultType = 'noNeed' | 'refund' | 'refundDeduction' | 'needMultiJob' | 'needSideIncome' | 'gray'

function calcResult(a: Answers): ResultType {
  const hasSide      = a.incomeTypes.includes('freelance') || a.incomeTypes.includes('flea')
  const hasPartTime  = a.incomeTypes.includes('part')
  const sideOver20   = a.sideIncome === 'over20'
  const unadjusted   = a.yearEndAdj === 'partial' || a.yearEndAdj === 'none'
  const multiJob     = a.jobCount === 'multi'
  const over178      = a.salaryRange === 'over178'
  const hasDeduction = a.deductions.length > 0 && !a.deductions.includes('none')

  if (hasSide && sideOver20)               return 'needSideIncome'
  if (over178)                             return 'needSideIncome'
  if (hasPartTime && multiJob)             return 'needMultiJob'
  if (unadjusted)                         return 'refund'
  if (hasDeduction)                       return 'refundDeduction'
  if (hasSide && !sideOver20 && unadjusted) return 'gray'
  return 'noNeed'
}

const RESULTS: Record<ResultType, {
  emoji: string; label: string; title: string; desc: string
  color: string; bg: string; border: string; action: string
}> = {
  noNeed:          { emoji:'✅', label:'申告不要',         title:'確定申告は不要です',                    desc:'現在の収入状況では確定申告の義務はありません。ただし控除の申告漏れがあると還付を受けられる場合もあります。',                              color:'text-teal-600',   bg:'bg-teal-50',   border:'border-teal-200',   action:'ケース別ガイドで詳しく確認する'     },
  refund:          { emoji:'💰', label:'還付申告できます',  title:'払いすぎた税金が戻ってきます！',         desc:'年末調整が未実施または途中退職があった場合、源泉徴収で引かれすぎた税金が還付される可能性があります。1月1日から5年間いつでも申告できます。',  color:'text-sky-600',    bg:'bg-sky-50',    border:'border-sky-200',    action:'還付申告の手順を確認する'           },
  refundDeduction: { emoji:'💰', label:'控除で還付できます', title:'申告すれば税金が戻ってきます！',        desc:'医療費控除・社会保険料控除・生命保険料控除などの申告漏れがあります。確定申告することで税金が還付される可能性があります。',                 color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-200', action:'控除の申告手順を確認する'           },
  needMultiJob:    { emoji:'⚠️', label:'申告が必要です',    title:'掛け持ちバイトは申告が必要です',         desc:'複数のバイト先がある場合、それぞれの給与を合算して申告する義務があります。期限内（3月15日まで）に申告してください。',                     color:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-200',  action:'掛け持ちバイトの申告手順を確認する' },
  needSideIncome:  { emoji:'⚠️', label:'申告が必要です',    title:'確定申告が必要・納税の可能性があります', desc:'副業・フリマ収入が20万円超、または給与収入が178万円超のため確定申告が必要です。期限内（3月15日まで）に申告してください。',               color:'text-red-600',    bg:'bg-red-50',    border:'border-red-200',    action:'申告の手順をガイドで確認する'       },
  gray:            { emoji:'🔍', label:'グレーゾーン',       title:'専門家への相談をおすすめします',         desc:'ご状況が複雑なため、税務署または税理士への相談をおすすめします。本アプリの情報はあくまで参考情報です。',                                  color:'text-gray-600',   bg:'bg-gray-50',   border:'border-gray-200',   action:'税務署・税理士に相談する'           },
}

// ── アイコン ─────────────────────────────────────────────
const NavIcons = {
  logout:   (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>),
  home:     (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>),
  diagnose: (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>),
  book:     (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
  check:    (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  chat:     (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>),
  record:   (<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>),
  back:     (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>),
}

// ── サイドバー ───────────────────────────────────────────
function Sidebar({ onNavigate }: { onNavigate: (s: string) => void }) {
  const items = [
    { id:'home',     label:'ホーム',        icon:NavIcons.home     },
    { id:'diagnose', label:'確定申告診断',   icon:NavIcons.diagnose },
    { id:'guide',    label:'ケース別ガイド', icon:NavIcons.book     },
    { id:'check',    label:'書類チェック',   icon:NavIcons.check    },
    { id:'chat',     label:'AIチャット',     icon:NavIcons.chat     },
    { id:'record',   label:'収入・経費記録', icon:NavIcons.record   },
  ]
  return (
    <div className="w-56 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
          {NavIcons.diagnose}
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-none">確定申告ナビ</p>
          <p className="text-sky-400 text-xs">学生向け PWA</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-slate-500 text-xs font-semibold px-3 mb-2 tracking-wider">MENU</p>
        {items.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              item.id === 'diagnose'
                ? 'bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border-l-2 border-transparent'
            }`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-700 pt-4 flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{auth.currentUser?.email?.[0].toUpperCase()}</span>
        </div>
        <p className="text-slate-400 text-xs flex-1 truncate">{auth.currentUser?.email}</p>
        <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-slate-300 transition-colors">
          {NavIcons.logout}
        </button>
      </div>
    </div>
  )
}

// ── ボトムナビ ───────────────────────────────────────────
function BottomNav({ onNavigate }: { onNavigate: (s: string) => void }) {
  const items = [
    { id:'home',     label:'ホーム',     icon:NavIcons.home     },
    { id:'diagnose', label:'診断',       icon:NavIcons.diagnose },
    { id:'record',   label:'記録',       icon:NavIcons.record   },
    { id:'guide',    label:'ガイド',     icon:NavIcons.book     },
    { id:'chat',     label:'AIチャット', icon:NavIcons.chat     },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {items.map((item) => (
        <button key={item.id} onClick={() => onNavigate(item.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            item.id === 'diagnose' ? 'text-sky-500' : 'text-gray-400'
          }`}>
          {item.icon}
          <span>{item.label}</span>
          {item.id === 'diagnose' && <span className="w-1 h-1 rounded-full bg-sky-500" />}
        </button>
      ))}
    </div>
  )
}

// ── 共通UIパーツ ─────────────────────────────────────────
function SelectCard({ label, sub, selected, onClick, emoji }: {
  label: string; sub?: string; selected: boolean; onClick: () => void; emoji?: string
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
      selected ? 'bg-sky-50 border-sky-400' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      {emoji && <span className="text-xl flex-shrink-0">{emoji}</span>}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${selected ? 'text-sky-700' : 'text-gray-800'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        selected ? 'border-sky-500 bg-sky-500' : 'border-gray-300'
      }`}>
        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </button>
  )
}

function CheckCard({ label, sub, checked, onClick, emoji }: {
  label: string; sub?: string; checked: boolean; onClick: () => void; emoji?: string
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
      checked ? 'bg-sky-50 border-sky-400' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      {emoji && <span className="text-xl flex-shrink-0">{emoji}</span>}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${checked ? 'text-sky-700' : 'text-gray-800'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
        checked ? 'border-sky-500 bg-sky-500' : 'border-gray-300'
      }`}>
        {checked && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
    </button>
  )
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-xl p-3">
      <span className="flex-shrink-0">ℹ️</span>
      <p className="text-sky-700 text-xs leading-relaxed">{text}</p>
    </div>
  )
}

function NextButton({ onClick, disabled, label = '次へ' }: {
  onClick: () => void; disabled: boolean; label?: string
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-white">
      {label}
    </button>
  )
}

// ── 各STEPコンポーネント ─────────────────────────────────
function Step1({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="在籍状況によって社会保険の扱いや適用できる控除が異なります。" />
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">学校の種類</p>
        <div className="flex flex-col gap-2">
          {[
            { value:'univ',   label:'大学・大学院',     emoji:'🎓' },
            { value:'junior', label:'短期大学',           emoji:'🏫' },
            { value:'kosen',  label:'高等専門学校',       emoji:'🔧' },
            { value:'sen',    label:'専修学校・専門学校', emoji:'📚' },
          ].map((s) => (
            <SelectCard key={s.value} label={s.label} emoji={s.emoji}
              selected={answers.schoolType === s.value}
              onClick={() => onChange('schoolType', s.value)} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">在籍状況</p>
        <div className="flex flex-col gap-2">
          {[
            { value:'day',     label:'昼間部（通学制）',     sub:'一般的な昼間学生',           emoji:'☀️' },
            { value:'evening', label:'夜間・通信制・定時制', sub:'社保の扱いが異なる場合あり', emoji:'🌙' },
            { value:'leave',   label:'休学中',               sub:'学籍はあるが授業は未受講',   emoji:'⏸️' },
          ].map((e) => (
            <SelectCard key={e.value} label={e.label} sub={e.sub} emoji={e.emoji}
              selected={answers.enrollment === e.value}
              onClick={() => onChange('enrollment', e.value)} />
          ))}
        </div>
      </div>
      <NextButton onClick={onNext} disabled={!answers.schoolType || !answers.enrollment} />
    </div>
  )
}

function Step2({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  const toggle = (v: string) => {
    const cur = answers.incomeTypes
    onChange('incomeTypes', cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="複数の収入がある場合はすべて選択してください。収入の種類によって申告方法が異なります。" />
      <div className="flex flex-col gap-2">
        {[
          { value:'part',      label:'アルバイト・パート',         sub:'給与収入（源泉徴収あり）',     emoji:'💼' },
          { value:'freelance', label:'業務委託・フリーランス',     sub:'報酬・委託費（源泉徴収あり）', emoji:'💻' },
          { value:'flea',      label:'フリマ・ネットオークション', sub:'メルカリ・ヤフオク等',         emoji:'📦' },
          { value:'other',     label:'その他',                     sub:'ポイント収入・仮想通貨等',     emoji:'📋' },
        ].map((t) => (
          <CheckCard key={t.value} label={t.label} sub={t.sub} emoji={t.emoji}
            checked={answers.incomeTypes.includes(t.value)}
            onClick={() => toggle(t.value)} />
        ))}
      </div>
      <NextButton onClick={onNext} disabled={answers.incomeTypes.length === 0} />
    </div>
  )
}

function Step3({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="掛け持ちの場合、各バイト先の給与を合算して申告が必要か判断します。複数の勤務先がある場合は確定申告が必要になる可能性があります。" />
      <div className="flex flex-col gap-2">
        <SelectCard emoji="1️⃣" label="1か所のみ" sub="バイト先が1社のみ"
          selected={answers.jobCount === 'one'} onClick={() => onChange('jobCount', 'one')} />
        <SelectCard emoji="2️⃣" label="2か所以上（掛け持ち）" sub="複数のバイト先がある"
          selected={answers.jobCount === 'multi'} onClick={() => onChange('jobCount', 'multi')} />
      </div>
      <NextButton onClick={onNext} disabled={!answers.jobCount} />
    </div>
  )
}

function Step4({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="年末調整が未実施の場合、払いすぎた税金が還付される可能性があります。退職した場合も還付申告ができます。" />
      <div className="flex flex-col gap-2">
        {[
          { value:'all',     label:'全社で年末調整済み',       sub:'すべてのバイト先で年末調整を受けた', emoji:'✅' },
          { value:'partial', label:'一部のみ年末調整済み',     sub:'一部のバイト先でのみ実施済み',       emoji:'⚠️' },
          { value:'none',    label:'どこも年末調整していない', sub:'全バイト先で未実施または途中退職',   emoji:'❌' },
        ].map((o) => (
          <SelectCard key={o.value} label={o.label} sub={o.sub} emoji={o.emoji}
            selected={answers.yearEndAdj === o.value}
            onClick={() => onChange('yearEndAdj', o.value)} />
        ))}
      </div>
      <NextButton onClick={onNext} disabled={!answers.yearEndAdj} />
    </div>
  )
}

function Step5({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="2026年分から所得税の非課税ラインが178万円に引き上げられました（年収200万円以下の場合）。源泉徴収票の「支払金額」欄の合計を確認してください。住民税は110万円を超えると課税されます。" />
      <div className="flex flex-col gap-2">
        {[
          { value:'under160', label:'160万円以下',            sub:'所得税は非課税（住民税は110万円超から課税）', emoji:'🟢' },
          { value:'160to178', label:'160万円超〜178万円以下', sub:'年収200万円以下なら所得税は非課税',           emoji:'🟡' },
          { value:'over178',  label:'178万円超',              sub:'所得税が発生する可能性あり',                  emoji:'🔴' },
        ].map((o) => (
          <SelectCard key={o.value} label={o.label} sub={o.sub} emoji={o.emoji}
            selected={answers.salaryRange === o.value}
            onClick={() => onChange('salaryRange', o.value)} />
        ))}
      </div>
      <NextButton onClick={onNext} disabled={!answers.salaryRange} />
    </div>
  )
}

function Step6({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="業務委託・フリマの「所得」は、収入から経費（交通費・材料費等）を差し引いた金額です。20万円を超えると確定申告が必要になります。" />
      <div className="flex flex-col gap-2">
        {[
          { value:'under20', label:'20万円以下', sub:'経費を差し引いた所得が20万円以下', emoji:'🟢' },
          { value:'over20',  label:'20万円超',   sub:'経費を差し引いた所得が20万円超',   emoji:'🔴' },
          { value:'none',    label:'収入はない', sub:'副業・フリマ収入は0円',             emoji:'—'  },
        ].map((o) => (
          <SelectCard key={o.value} label={o.label} sub={o.sub} emoji={o.emoji}
            selected={answers.sideIncome === o.value}
            onClick={() => onChange('sideIncome', o.value)} />
        ))}
      </div>
      <NextButton onClick={onNext} disabled={!answers.sideIncome} />
    </div>
  )
}

function Step7({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="扶養から外れると親の税負担が増える場合があります。収入に応じて扶養の範囲が変わるので確認しましょう。" />
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">親の健康保険の扶養に入っていますか？</p>
        <p className="text-xs text-gray-400 mb-2">年収130万円未満（19〜22歳は150万円未満）で継続可能</p>
        <div className="flex flex-col gap-2">
          {[
            { value:'yes',     label:'入っている'                    },
            { value:'no',      label:'入っていない（自分で国保に加入）' },
            { value:'unknown', label:'わからない'                    },
          ].map((o) => (
            <SelectCard key={o.value} label={o.label}
              selected={answers.healthInsurance === o.value}
              onClick={() => onChange('healthInsurance', o.value)} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">親の所得税の扶養に入っていますか？</p>
        <p className="text-xs text-gray-400 mb-2">合計所得58万円以下（給与収入123万円以下）で扶養継続</p>
        <div className="flex flex-col gap-2">
          {[
            { value:'yes',     label:'入っている'  },
            { value:'no',      label:'入っていない' },
            { value:'unknown', label:'わからない'  },
          ].map((o) => (
            <SelectCard key={o.value} label={o.label}
              selected={answers.taxDependent === o.value}
              onClick={() => onChange('taxDependent', o.value)} />
          ))}
        </div>
      </div>
      <NextButton onClick={onNext} disabled={!answers.healthInsurance || !answers.taxDependent} />
    </div>
  )
}

function Step8({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  const toggle = (v: string) => {
    if (v === 'none') { onChange('deductions', ['none']); return }
    const cur = answers.deductions.filter((x) => x !== 'none')
    onChange('deductions', cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="申告することで税金が還付される控除です。年末調整で申告済みのものは除いてください。複数選択できます。" />
      <div className="flex flex-col gap-2">
        {[
          { value:'socialInsurance', label:'国民年金・国民健康保険を自分で支払っている', sub:'→ 社会保険料控除（支払額全額）', emoji:'🏥' },
          { value:'medical',         label:'年間の医療費が10万円を超えた',               sub:'→ 医療費控除（超えた金額）',     emoji:'💊' },
          { value:'lifeInsurance',   label:'生命保険に自分で加入している',               sub:'→ 生命保険料控除（最大12万円）', emoji:'📋' },
          { value:'donation',        label:'ふるさと納税・寄付をした',                   sub:'→ 寄付金控除',                   emoji:'🎁' },
          { value:'disabled',        label:'障害者手帳を持っている',                     sub:'→ 障害者控除（27〜75万円）',     emoji:'♿' },
          { value:'none',            label:'該当なし',                                   sub:'上記の控除は受けない',           emoji:'—'  },
        ].map((d) => (
          <CheckCard key={d.value} label={d.label} sub={d.sub} emoji={d.emoji}
            checked={answers.deductions.includes(d.value)}
            onClick={() => toggle(d.value)} />
        ))}
      </div>
      <NextButton onClick={onNext} disabled={answers.deductions.length === 0} />
    </div>
  )
}

function Step9({ answers, onChange, onNext }: {
  answers: Answers; onChange: (k: keyof Answers, v: string | string[]) => void; onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InfoBox text="2026年から勤労学生控除は主に住民税の軽減効果があります。合計所得85万円以下・勤労によらない所得10万円以下が条件です。" />
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3">勤労学生控除の適用条件</p>
        {[
          '学校に在籍している（大学・専修学校等）',
          '給与などの勤労による所得がある',
          '合計所得金額が85万円以下',
          '勤労によらない所得が10万円以下（仕送り・仮想通貨等）',
        ].map((c, i) => (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <span className="text-sky-500 text-xs mt-0.5">✓</span>
            <p className="text-xs text-gray-600">{c}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">勤労学生控除を申請しますか？</p>
        <div className="flex flex-col gap-2">
          {[
            { value:'yes',     label:'申請する（条件を満たしている）', sub:'住民税の負担を軽減できる' },
            { value:'no',      label:'申請しない・条件を満たしていない', sub: undefined },
            { value:'unknown', label:'わからない', sub: undefined },
          ].map((o) => (
            <SelectCard key={o.value} label={o.label} sub={o.sub}
              selected={answers.workerStudent === o.value}
              onClick={() => onChange('workerStudent', o.value)} />
          ))}
        </div>
      </div>
      <NextButton onClick={onNext} disabled={!answers.workerStudent} label="診断結果を見る" />
    </div>
  )
}

// ── 診断結果 ─────────────────────────────────────────────
function DiagnosisResult({ answers, onRestart, onNavigate }: {
  answers: Answers; onRestart: () => void; onNavigate: (s: string) => void
}) {
  const resultKey = calcResult(answers)
  const result    = RESULTS[resultKey]

  return (
    <div className="flex flex-col gap-4">
      <div className={`${result.bg} border ${result.border} rounded-2xl p-6 text-center`}>
        <div className="text-5xl mb-3">{result.emoji}</div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${result.color} border ${result.border}`}>
          {result.label}
        </span>
        <h2 className={`text-lg font-bold ${result.color} mb-3`}>{result.title}</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{result.desc}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">入力内容の確認</p>
        {[
          { label:'在籍状況',   value: answers.enrollment === 'day' ? '昼間部' : answers.enrollment === 'evening' ? '夜間・通信制' : '休学中' },
          { label:'収入の種類', value: answers.incomeTypes.join('・') || 'なし' },
          { label:'給与収入',   value: answers.salaryRange === 'under160' ? '160万円以下' : answers.salaryRange === '160to178' ? '160〜178万円' : '178万円超' },
          { label:'年末調整',   value: answers.yearEndAdj === 'all' ? '全社済み' : answers.yearEndAdj === 'partial' ? '一部のみ' : '未実施' },
          { label:'控除の有無', value: answers.deductions.includes('none') ? 'なし' : answers.deductions.length > 0 ? `${answers.deductions.length}種類あり` : '未回答' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
            <span className="text-gray-400 text-xs">{row.label}</span>
            <span className="text-gray-700 text-xs font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <button onClick={() => onNavigate('guide')}
        className={`w-full py-3.5 rounded-2xl text-sm font-bold border ${result.border} ${result.bg} ${result.color}`}>
        {result.action}
      </button>
      <button onClick={onRestart}
        className="w-full py-3 rounded-2xl text-sm text-gray-400 bg-gray-50 border border-gray-200">
        もう一度診断する
      </button>
      <p className="text-gray-400 text-xs text-center leading-relaxed pb-2">
        ※ 本アプリの情報は参考情報です。<br />最終的な判断は税務署または税理士にご相談ください。
      </p>
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────
export default function DiagnosisScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [step, setStep]       = useState(1)
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS)
  const [done, setDone]       = useState(false)

  const hasSide = answers.incomeTypes.includes('freelance') || answers.incomeTypes.includes('flea')
  const hasPart = answers.incomeTypes.includes('part')
  const TOTAL   = hasSide ? 9 : 8

  const update = (key: keyof Answers, value: string | string[]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }))

  const next = () => {
    if (step === 2 && !hasPart) { setStep(4); return }
    if (step === 5 && !hasSide) { setStep(7); return }
    if (step >= 8)              { setDone(true); return }
    setStep((s) => s + 1)
  }

  const back = () => {
    if (done)                   { setDone(false); setStep(hasSide ? 9 : 8); return }
    if (step === 1)             { onNavigate('home'); return }
    if (step === 4 && !hasPart) { setStep(2); return }
    if (step === 7 && !hasSide) { setStep(5); return }
    setStep((s) => s - 1)
  }

  const restart = () => { setStep(1); setAnswers(INITIAL_ANSWERS); setDone(false) }

  const STEP_TITLES: Record<number, string> = {
    1:'在籍校・在籍状況', 2:'収入の種類',    3:'バイト先の数',
    4:'年末調整の状況',   5:'給与収入の確認', 6:'副業・フリマ収入',
    7:'扶養の確認',       8:'控除の確認',     9:'勤労学生控除',
  }

  const stepProps = { answers, onChange: update, onNext: next }

  const StepContent = () => (
    <>
      {step === 1 && <Step1 {...stepProps} />}
      {step === 2 && <Step2 {...stepProps} />}
      {step === 3 && <Step3 {...stepProps} />}
      {step === 4 && <Step4 {...stepProps} />}
      {step === 5 && <Step5 {...stepProps} />}
      {step === 6 && <Step6 {...stepProps} />}
      {step === 7 && <Step7 {...stepProps} />}
      {step === 8 && <Step8 {...stepProps} />}
      {step === 9 && <Step9 {...stepProps} onNext={() => setDone(true)} />}
    </>
  )

  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden min-h-screen bg-gray-100 flex flex-col">

        {/* ヘッダー */}
        <div className="bg-slate-800 px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={back}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
              {NavIcons.back}
            </button>
            <div>
              <h1 className="text-white text-lg font-bold">{done ? '診断結果' : STEP_TITLES[step]}</h1>
              <p className="text-slate-400 text-xs">確定申告診断</p>
            </div>
          </div>
        </div>

        {/* プログレスバー */}
        {!done && (
          <div className="px-5 py-3 bg-white border-b border-gray-200">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-400">STEP {step} / {TOTAL}</span>
              <span className="text-xs text-gray-400">{Math.round((step / TOTAL) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-sky-500 h-1.5 rounded-full transition-all"
                style={{ width:`${(step / TOTAL) * 100}%` }} />
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div className="flex-1 overflow-auto px-4 py-4 pb-24">
          {done
            ? <DiagnosisResult answers={answers} onRestart={restart} onNavigate={onNavigate} />
            : <StepContent />
          }
        </div>

        <BottomNav onNavigate={onNavigate} />
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex min-h-screen bg-gray-100">

        <Sidebar onNavigate={onNavigate} />

        <div className="flex-1 flex flex-col overflow-auto">

          {/* ページヘッダー */}
          <div className="flex items-center gap-4 px-8 py-5 bg-slate-800 border-b border-slate-700">
            <button onClick={back}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
              {NavIcons.back}
            </button>
            <div>
              <h2 className="text-white text-xl font-bold">{done ? '診断結果' : STEP_TITLES[step]}</h2>
              <p className="text-slate-400 text-sm mt-0.5">確定申告診断</p>
            </div>
          </div>

          {/* プログレスバー */}
          {!done && (
            <div className="px-8 py-4 bg-white border-b border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400">STEP {step} / {TOTAL}</span>
                <span className="text-xs text-gray-400">{Math.round((step / TOTAL) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full transition-all"
                  style={{ width:`${(step / TOTAL) * 100}%` }} />
              </div>
            </div>
          )}

          {/* コンテンツ */}
          <div className="flex-1 p-8">
            {done ? (
              <div className="max-w-2xl mx-auto">
                <DiagnosisResult answers={answers} onRestart={restart} onNavigate={onNavigate} />
              </div>
            ) : (
              <div className="max-w-5xl grid grid-cols-5 gap-8">

                {/* 左：STEPフォーム（3/5） */}
                <div className="col-span-3">
                  <StepContent />
                </div>

                {/* 右：進捗・税制ヒント（2/5） */}
                <div className="col-span-2 flex flex-col gap-4">

                  {/* STEP一覧 */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">診断の流れ</p>
                    <div className="flex flex-col gap-2">
                      {Object.entries(STEP_TITLES)
                        .filter(([n]) => {
                          const num = Number(n)
                          if (num === 3 && !hasPart) return false
                          if (num === 6 && !hasSide) return false
                          if (num === 9 && !hasSide) return false
                          return true
                        })
                        .map(([n, title]) => {
                          const num    = Number(n)
                          const isDone = num < step
                          const isCur  = num === step
                          return (
                            <div key={n} className={`flex items-center gap-3 p-2.5 rounded-xl ${isCur ? 'bg-sky-50' : ''}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isDone ? 'bg-sky-500 text-white'
                                : isCur ? 'bg-sky-100 text-sky-600 border-2 border-sky-500'
                                : 'bg-gray-100 text-gray-400'
                              }`}>
                                {isDone ? '✓' : n}
                              </div>
                              <p className={`text-xs font-medium ${
                                isCur ? 'text-sky-700' : isDone ? 'text-gray-400' : 'text-gray-500'
                              }`}>{title}</p>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* 2026年税制メモ */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">2026年の主な変更点</p>
                    <div className="flex flex-col gap-3">
                      {[
                        { label:'所得税の壁', value:'178万円', note:'2026年分〜（年収200万円以下）', color:'text-sky-500'    },
                        { label:'住民税の壁', value:'110万円', note:'110万円超から課税',              color:'text-purple-500' },
                        { label:'社保の扶養', value:'130万円', note:'変更なし',                        color:'text-amber-500'  },
                      ].map((w) => (
                        <div key={w.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-gray-700 text-xs font-medium">{w.label}</p>
                            <p className="text-gray-400 text-xs">{w.note}</p>
                          </div>
                          <p className={`${w.color} text-sm font-bold`}>{w.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto py-6">
            <p className="text-gray-400 text-xs text-center">
              ※ 本アプリの情報は参考情報です。最終的な判断は税務署または税理士にご相談ください。
            </p>
          </div>
        </div>
      </div>
    </>
  )
}