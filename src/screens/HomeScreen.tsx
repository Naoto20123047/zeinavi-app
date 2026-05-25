import { auth } from '../lib/firebase'

// ── アイコン定義 ────────────────────────────────────────
const Icons = {
  logout: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  diagnose: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  clock: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  home: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  book: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  chat: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  check: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  record: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
}

// ── メニューアイテム定義 ─────────────────────────────────
const MENU_ITEMS = [
  {
    icon: Icons.book,
    label: 'ケース別ガイド',
    sub: 'バイト・業務委託・フリマ',
    iconBg: 'bg-teal-500',
    screen: '',
  },
  {
    icon: Icons.record,
    label: '収入・経費の記録',
    sub: '毎月の入出金を記録',
    iconBg: 'bg-orange-500',
    screen: 'record',
  },
  {
    icon: Icons.chat,
    label: 'AIチャット',
    sub: '疑問をすぐ相談',
    iconBg: 'bg-sky-500',
    screen: '',
  },
  {
    icon: Icons.check,
    label: '書類チェック',
    sub: '源泉徴収票・マイナンバー',
    iconBg: 'bg-slate-500',
    screen: '',
  },
]

// ── 収入プログレスバー ────────────────────────────────────
function IncomeBar() {
  const current = 420000
  const limit   = 1300000
  const pct     = Math.round((current / limit) * 100)
  const remain  = limit - current

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-xs">今年の収入記録</span>
        <span className="text-gray-400 text-xs">130万円まで</span>
      </div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-gray-900 text-2xl font-bold">
          ¥{current.toLocaleString()}
        </span>
        <span className="text-gray-400 text-sm">
          残り ¥{remain.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-sky-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── 診断CTAカード ────────────────────────────────────────
function DiagnosisCTA({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <button
      onClick={() => onNavigate('diagnose')}
      className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
    >
      <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 text-white">
        {Icons.diagnose}
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-xs mb-0.5">まずはここから</p>
        <p className="text-gray-900 font-bold text-sm leading-tight">
          確定申告が必要か診断する
        </p>
        <p className="text-gray-400 text-xs mt-0.5">基本情報の入力・約3分</p>
      </div>
      <span className="text-gray-400">{Icons.arrow}</span>
    </button>
  )
}

// ── 期限カード ───────────────────────────────────────────
function DeadlineCard() {
  return (
    <button className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
      <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 text-white">
        {Icons.clock}
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-xs mb-0.5">今年の確定申告期限まで</p>
        <p className="text-gray-900 font-bold text-lg leading-tight">
          あと <span className="text-2xl">150</span>日
        </p>
        <p className="text-gray-400 text-xs mt-0.5">締め切り 2027年3月15日</p>
      </div>
      <span className="text-gray-400">{Icons.arrow}</span>
    </button>
  )
}

// ── メニューリスト ───────────────────────────────────────
function MenuList({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <div>
      <p className="text-gray-400 text-xs font-semibold tracking-wider mb-3 px-1">
        メニュー
      </p>
      <div className="flex flex-col gap-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => { if (item.screen) onNavigate(item.screen) }}
            className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 text-white`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>
            </div>
            <span className="text-gray-300">{Icons.arrow}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ボトムナビ（モバイル） ───────────────────────────────
function BottomNav({
  active,
  onNavigate,
}: {
  active: string
  onNavigate: (screen: string) => void
}) {
  const items = [
    { id: 'home',     label: 'ホーム',     icon: Icons.home     },
    { id: 'diagnose', label: '診断',       icon: Icons.diagnose },
    { id: 'record',   label: '記録',       icon: Icons.record   },
    { id: 'guide',    label: 'ガイド',     icon: Icons.book     },
    { id: 'chat',     label: 'AIチャット', icon: Icons.chat     },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            active === item.id ? 'text-sky-500' : 'text-gray-400'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
          {active === item.id && (
            <span className="w-1 h-1 rounded-full bg-sky-500" />
          )}
        </button>
      ))}
    </div>
  )
}

// ── サイドバー（デスクトップ） ───────────────────────────
function Sidebar({
  active,
  onNavigate,
}: {
  active: string
  onNavigate: (screen: string) => void
}) {
  const items = [
    { id: 'home',     label: 'ホーム',        icon: Icons.home     },
    { id: 'diagnose', label: '確定申告診断',   icon: Icons.diagnose },
    { id: 'guide',    label: 'ケース別ガイド', icon: Icons.book     },
    { id: 'check',    label: '書類チェック',   icon: Icons.check    },
    { id: 'chat',     label: 'AIチャット',     icon: Icons.chat     },
    { id: 'record',   label: '収入・経費記録', icon: Icons.record   },
  ]
  return (
    <div className="w-56 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col p-4">
      {/* ロゴ */}
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
          {Icons.diagnose}
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-none">確定申告ナビ</p>
        </div>
      </div>

      {/* ナビ */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-slate-500 text-xs font-semibold px-3 mb-2 tracking-wider">MENU</p>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              active === item.id
                ? 'bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border-l-2 border-transparent'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* ユーザー情報 */}
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
          {Icons.logout}
        </button>
      </div>
    </div>
  )
}

// ── メインコンポーネント ────────────────────────────────
export default function HomeScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden min-h-screen bg-gray-100">

        {/* ヘッダー */}
        <div className="px-5 pt-14 pb-4 bg-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold tracking-widest mb-1">
                学生向け
              </p>
              <h1 className="text-white text-2xl font-bold">確定申告ナビ</h1>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 mt-1"
            >
              {Icons.logout}
            </button>
          </div>
        </div>

        {/* スクロールエリア */}
        <div className="px-4 pt-4 pb-28 flex flex-col gap-3">
          <IncomeBar />
          <DiagnosisCTA onNavigate={onNavigate} />
          <DeadlineCard />
          <MenuList onNavigate={onNavigate} />
          <p className="text-gray-400 text-xs text-center pt-2 leading-relaxed">
            ※ 本アプリの情報は参考情報です。<br />
            最終的な判断は税務署または税理士にご相談ください。
          </p>
        </div>

        <BottomNav active="home" onNavigate={onNavigate} />
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex min-h-screen bg-gray-100">

        <Sidebar active="home" onNavigate={onNavigate} />

        {/* メインエリア */}
        <div className="flex-1 overflow-auto flex flex-col min-h-screen">

          {/* ページヘッダー */}
          <div className="flex justify-between items-center px-8 py-5 bg-slate-800 border-b border-slate-700">
            <div>
              <h2 className="text-white text-xl font-bold">ホーム</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                2026年5月14日（木）
              </p>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-sm transition-colors"
            >
              {Icons.logout}
              ログアウト
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-8">
            <div className="max-w-5xl grid grid-cols-5 gap-6">

              {/* 左カラム（3/5） */}
              <div className="col-span-3 flex flex-col gap-4">
                <IncomeBar />
                <div className="grid grid-cols-2 gap-3">
                  <DiagnosisCTA onNavigate={onNavigate} />
                  <DeadlineCard />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold tracking-wider mb-3 px-1">
                    メニュー
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {MENU_ITEMS.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { if (item.screen) onNavigate(item.screen) }}
                        className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:bg-gray-50 transition-all"
                      >
                        <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 text-white`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右カラム（2/5） */}
              <div className="col-span-2 flex flex-col gap-4">

                {/* 税制情報カード */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-gray-400 text-xs font-semibold tracking-wider mb-4">
                    2026年 年収の壁
                  </p>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: '所得税の壁', amount: '178万円', color: 'text-sky-500',    note: '2026年分〜', changed: true  },
                      { label: '住民税の壁', amount: '110万円', color: 'text-purple-500', note: '2025年分〜', changed: true  },
                      { label: '社保の扶養', amount: '130万円', color: 'text-amber-500',  note: '変更無し',  changed: false },
                    ].map((w) => (
                      <div key={w.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-gray-700 text-sm font-medium">{w.label}</p>
                          <p className="text-gray-400 text-xs">{w.note}</p>
                        </div>
                        <div className="text-right">
                          <p className={`${w.color} text-sm font-bold`}>{w.amount}</p>
                          {w.changed && (
                            <span className="text-xs bg-sky-50 text-sky-500 px-1.5 py-0.5 rounded-md">
                              改正
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* お知らせカード */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-gray-400 text-xs font-semibold tracking-wider mb-4">
                    お知らせ
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <div>
                        <p className="text-amber-700 text-xs font-semibold">
                          確定申告期限まで残り150日
                        </p>
                        <p className="text-amber-500 text-xs mt-0.5">
                          締め切り 2027年3月15日
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <span className="text-base flex-shrink-0">💡</span>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        申告すれば数千〜数万円が戻ってくることがあります
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 免責事項 */}
          <div className="mt-auto py-6">
            <p className="text-gray-400 text-xs text-center leading-relaxed">
              ※ 本アプリの情報は参考情報です。最終的な判断は税務署または税理士にご相談ください。
            </p>
          </div>

        </div>
      </div>
    </>
  )
}