import { useState } from 'react'
import { auth } from '../../lib/firebase'

// ── 型定義 ──────────────────────────────────────────────
type IncomeType = 'アルバイト' | '業務委託' | 'フリマ' | 'その他'
type ExpenseType = '交通費' | '通信費' | '機材費' | '書籍費' | 'その他'

interface IncomeRecord {
  id: number
  type: IncomeType
  amount: number
  from: string
  date: string
}

interface ExpenseRecord {
  id: number
  type: ExpenseType
  amount: number
  memo: string
  date: string
}

const INCOME_COLORS: Record<IncomeType, string> = {
  'アルバイト': 'bg-sky-500',
  '業務委託':   'bg-teal-500',
  'フリマ':     'bg-purple-500',
  'その他':     'bg-gray-500',
}

const EXPENSE_COLORS: Record<ExpenseType, string> = {
  '交通費': 'bg-red-400',
  '通信費': 'bg-orange-400',
  '機材費': 'bg-yellow-500',
  '書籍費': 'bg-green-500',
  'その他': 'bg-gray-500',
}

const INITIAL_INCOMES: IncomeRecord[] = [
  { id: 1, type: 'アルバイト', amount: 120000, from: '〇〇カフェ', date: '2026/5/15' },
  { id: 2, type: '業務委託',   amount: 50000,  from: '〇〇カフェ', date: '2026/5/15' },
  { id: 3, type: 'アルバイト', amount: 110000, from: '〇〇カフェ', date: '2026/5/15' },
  { id: 4, type: 'アルバイト', amount: 140000, from: '〇〇カフェ', date: '2026/4/15' },
]

const INITIAL_EXPENSES: ExpenseRecord[] = [
  { id: 1, type: '交通費', amount: 3200, memo: '取材交通費',   date: '2026/5/15' },
  { id: 2, type: '通信費', amount: 2000, memo: 'スマホ代',     date: '2026/5/15' },
  { id: 3, type: '機材費', amount: 1000, memo: 'ケーブル購入', date: '2026/5/15' },
]

// ── アイコン ─────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const NavIcons = {
  logout: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  home: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  diagnose: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  book: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  check: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chat: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  record: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
}

// ── サイドバー ───────────────────────────────────────────
function Sidebar({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const items = [
    { id: 'home',     label: 'ホーム',        icon: NavIcons.home     },
    { id: 'diagnose', label: '確定申告診断',   icon: NavIcons.diagnose },
    { id: 'guide',    label: 'ケース別ガイド', icon: NavIcons.book     },
    { id: 'check',    label: '書類チェック',   icon: NavIcons.check    },
    { id: 'chat',     label: 'AIチャット',     icon: NavIcons.chat     },
    { id: 'record',   label: '収入・経費記録', icon: NavIcons.record   },
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
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              item.id === 'record'
                ? 'bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border-l-2 border-transparent'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-700 pt-4 flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {auth.currentUser?.email?.[0].toUpperCase()}
          </span>
        </div>
        <p className="text-slate-400 text-xs flex-1 truncate">
          {auth.currentUser?.email}
        </p>
        <button
          onClick={() => auth.signOut()}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          {NavIcons.logout}
        </button>
      </div>
    </div>
  )
}

// ── 収入登録モーダル ─────────────────────────────────────
function IncomeModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (record: Omit<IncomeRecord, 'id'>) => void
}) {
  const [type, setType]     = useState<IncomeType>('アルバイト')
  const [amount, setAmount] = useState('')
  const [from, setFrom]     = useState('')

  const handleSave = () => {
    if (!amount) return
    onSave({ type, amount: Number(amount), from, date: new Date().toLocaleDateString('ja-JP') })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 z-10">
        <h3 className="text-gray-900 font-bold text-base mb-5">収入登録</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">収入種別</label>
            <select value={type} onChange={(e) => setType(e.target.value as IncomeType)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-sky-500">
              {(['アルバイト', '業務委託', 'フリマ', 'その他'] as IncomeType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">金額</label>
            <input type="number" placeholder="金額を入力" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-sky-500 placeholder-gray-300" />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">振り込み元</label>
            <input type="text" placeholder="振り込み元" value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-sky-500 placeholder-gray-300" />
          </div>
          <button onClick={handleSave} disabled={!amount}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl py-3 text-sm disabled:opacity-40 transition-colors">
            登録
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 経費登録モーダル ─────────────────────────────────────
function ExpenseModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (record: Omit<ExpenseRecord, 'id'>) => void
}) {
  const [type, setType]     = useState<ExpenseType>('交通費')
  const [amount, setAmount] = useState('')
  const [memo, setMemo]     = useState('')

  const handleSave = () => {
    if (!amount) return
    onSave({ type, amount: Number(amount), memo, date: new Date().toLocaleDateString('ja-JP') })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 z-10">
        <h3 className="text-gray-900 font-bold text-base mb-5">経費登録</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">支出種別</label>
            <select value={type} onChange={(e) => setType(e.target.value as ExpenseType)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-sky-500">
              {(['交通費', '通信費', '機材費', '書籍費', 'その他'] as ExpenseType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">金額</label>
            <input type="number" placeholder="金額を入力" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-sky-500 placeholder-gray-300" />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">メモ</label>
            <input type="text" placeholder="メモを入力" value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-sky-500 placeholder-gray-300" />
          </div>
          <button onClick={handleSave} disabled={!amount}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl py-3 text-sm disabled:opacity-40 transition-colors">
            登録
          </button>
        </div>
      </div>
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────
export default function RecordScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [tab, setTab]           = useState<'income' | 'expense'>('income')
  const [incomes, setIncomes]   = useState<IncomeRecord[]>(INITIAL_INCOMES)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES)
  const [showModal, setShowModal] = useState(false)

  const totalIncome  = incomes.reduce((s, r) => s + r.amount, 0)
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0)
  const totalBalance = totalIncome - totalExpense

  const addIncome  = (r: Omit<IncomeRecord,  'id'>) => setIncomes( (p) => [{ ...r, id: Date.now() }, ...p])
  const addExpense = (r: Omit<ExpenseRecord, 'id'>) => setExpenses((p) => [{ ...r, id: Date.now() }, ...p])

  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden min-h-screen bg-gray-100 flex flex-col">

        {/* ヘッダー */}
        <div className="bg-slate-800 px-5 pt-14 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => onNavigate('home')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
              <BackIcon />
            </button>
            <h1 className="text-white text-xl font-bold">収入・経費記録</h1>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '年間収入', value: totalIncome,  color: 'text-white'   },
              { label: '年間経費', value: totalExpense, color: 'text-red-400' },
              { label: '収支差額', value: totalBalance, color: 'text-sky-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-700/50 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className={`${s.color} text-sm font-bold`}>¥{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setTab('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
              収入記録
            </button>
            <button onClick={() => setTab('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
              経費記録
            </button>
          </div>
        </div>

        {/* リスト */}
        <div className="flex-1 overflow-auto px-4 pt-4 pb-32">
          <div className="flex flex-col gap-2">
            {tab === 'income' ? (
              incomes.length === 0
                ? <p className="text-gray-400 text-sm text-center py-12">収入記録がありません</p>
                : incomes.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <span className={`${INCOME_COLORS[item.type]} text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0`}>{item.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs">{item.date}</p>
                      <p className="text-gray-500 text-xs truncate">{item.from}</p>
                    </div>
                    <p className="text-gray-900 font-bold text-sm flex-shrink-0">¥{item.amount.toLocaleString()}</p>
                  </div>
                ))
            ) : (
              expenses.length === 0
                ? <p className="text-gray-400 text-sm text-center py-12">経費記録がありません</p>
                : expenses.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <span className={`${EXPENSE_COLORS[item.type]} text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0`}>{item.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs">{item.date}</p>
                      <p className="text-gray-500 text-xs truncate">{item.memo}</p>
                    </div>
                    <p className="text-gray-900 font-bold text-sm flex-shrink-0">¥{item.amount.toLocaleString()}</p>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* フローティングボタン */}
        <button onClick={() => setShowModal(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40">
          <PlusIcon />
        </button>

        {/* ボトムナビ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
          {[
            { id: 'home',     label: 'ホーム',     icon: NavIcons.home     },
            { id: 'diagnose', label: '診断',       icon: NavIcons.diagnose },
            { id: 'record',   label: '記録',       icon: NavIcons.record   },
            { id: 'guide',    label: 'ガイド',     icon: NavIcons.book     },
            { id: 'chat',     label: 'AIチャット', icon: NavIcons.chat     },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                item.id === 'record' ? 'text-sky-500' : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'record' && (
                <span className="w-1 h-1 rounded-full bg-sky-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex min-h-screen bg-gray-100">

        {/* サイドバー */}
        <Sidebar onNavigate={onNavigate} />

        {/* メインエリア */}
        <div className="flex-1 flex flex-col overflow-auto">

          {/* ページヘッダー */}
          <div className="flex justify-between items-center px-8 py-5 bg-slate-800 border-b border-slate-700">
            <div>
              <h2 className="text-white text-xl font-bold">収入・経費記録</h2>
              <p className="text-slate-400 text-sm mt-0.5">2026年5月14日（木）</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <PlusIcon />
              {tab === 'income' ? '収入を追加' : '経費を追加'}
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-8 flex flex-col gap-6 max-w-5xl w-full">

            {/* サマリー */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '年間収入', value: totalIncome,  color: 'text-gray-900' },
                { label: '年間経費', value: totalExpense, color: 'text-red-500'  },
                { label: '収支差額', value: totalBalance, color: 'text-sky-500'  },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-gray-400 text-xs mb-2">{s.label}</p>
                  <p className={`${s.color} text-xl font-bold`}>¥{s.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* タブ＋テーブル */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button onClick={() => setTab('income')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${tab === 'income' ? 'text-sky-500 border-sky-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                  収入記録
                </button>
                <button onClick={() => setTab('expense')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${tab === 'expense' ? 'text-sky-500 border-sky-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                  経費記録
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-gray-400 text-xs font-semibold">種別</p>
                <p className="text-gray-400 text-xs font-semibold">日付</p>
                <p className="text-gray-400 text-xs font-semibold">{tab === 'income' ? '振り込み元' : 'メモ'}</p>
                <p className="text-gray-400 text-xs font-semibold text-right">金額</p>
              </div>
              <div className="divide-y divide-gray-100">
                {tab === 'income' ? (
                  incomes.length === 0
                    ? <p className="text-gray-400 text-sm text-center py-12">収入記録がありません</p>
                    : incomes.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <span className={`${INCOME_COLORS[item.type]} text-white text-xs font-semibold px-2.5 py-1 rounded-lg w-fit`}>{item.type}</span>
                        <p className="text-gray-500 text-sm self-center">{item.date}</p>
                        <p className="text-gray-700 text-sm self-center truncate">{item.from}</p>
                        <p className="text-gray-900 font-bold text-sm text-right self-center">¥{item.amount.toLocaleString()}</p>
                      </div>
                    ))
                ) : (
                  expenses.length === 0
                    ? <p className="text-gray-400 text-sm text-center py-12">経費記録がありません</p>
                    : expenses.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <span className={`${EXPENSE_COLORS[item.type]} text-white text-xs font-semibold px-2.5 py-1 rounded-lg w-fit`}>{item.type}</span>
                        <p className="text-gray-500 text-sm self-center">{item.date}</p>
                        <p className="text-gray-700 text-sm self-center truncate">{item.memo}</p>
                        <p className="text-gray-900 font-bold text-sm text-right self-center">¥{item.amount.toLocaleString()}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto py-6">
            <p className="text-gray-400 text-xs text-center">
              ※ この記録は診断フローには影響しません。目安としてご活用ください。
            </p>
          </div>
        </div>
      </div>

      {/* モーダル */}
      {showModal && tab === 'income' && (
        <IncomeModal onClose={() => setShowModal(false)} onSave={addIncome} />
      )}
      {showModal && tab === 'expense' && (
        <ExpenseModal onClose={() => setShowModal(false)} onSave={addExpense} />
      )}
    </>
  )
}