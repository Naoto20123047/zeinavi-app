import { useState, useRef, useEffect } from 'react'
import { auth } from '../../lib/firebase'

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
  send:     (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>),
}

// ── 型定義 ───────────────────────────────────────────────
interface Message {
  id:   number
  role: 'user' | 'assistant'
  text: string
}

// ── クイック質問 ─────────────────────────────────────────
const QUICK_QUESTIONS = [
  '178万円の壁とは何ですか？',
  '掛け持ちバイトの申告方法は？',
  '源泉徴収票の見方を教えて',
  '業務委託の経費にできるものは？',
  '還付金はいつ振り込まれますか？',
  'e-Taxの使い方を教えて',
]

// ── デモレスポンス ───────────────────────────────────────
function getDemoResponse(question: string): string {
  const q = question

  if (q.includes('178万') || q.includes('103万') || q.includes('壁')) {
    return '【2026年最新】年収の壁についてお答えします。\n\n📋 所得税の壁：178万円\n年収178万円まで所得税はかかりません（年収200万円以下の場合）。2026年分から適用です。\n\n📋 住民税の壁：110万円\n110万円を超えると住民税が課税されます。\n\n📋 社保の扶養：130万円\n130万円を超えると親の社会保険の扶養から外れます（19〜22歳は150万円）。\n\n⚠️ 具体的な判断は税務署にご確認ください。'
  }

  if (q.includes('掛け持ち') || q.includes('複数') || q.includes('バイト')) {
    return '掛け持ちバイトの確定申告についてお答えします。\n\n📋 原則として申告が必要です\n複数のバイト先がある場合、メインのバイト先以外は「乙欄」で高めに源泉徴収されています。確定申告で精算することで還付を受けられる可能性があります。\n\n📋 必要なもの\n・全バイト先の源泉徴収票\n・マイナンバーカード\n・銀行口座情報\n\n📋 申告方法\ne-Taxで申告書を作成し、すべての源泉徴収票の内容を入力します。\n\n⚠️ 具体的な判断は税務署にご確認ください。'
  }

  if (q.includes('源泉徴収票') || q.includes('見方')) {
    return '源泉徴収票の主な項目の見方をお答えします。\n\n📋 支払金額\n年間の給与総額です。確定申告ではこの金額を使います。\n\n📋 給与所得控除後の金額\n支払金額から給与所得控除を引いた金額です。\n\n📋 所得控除の額の合計額\n年末調整で適用された各種控除の合計です。\n\n📋 源泉徴収税額\nすでに引かれた所得税の金額です。還付申告ではこの金額が戻ってくる場合があります。\n\n⚠️ 不明な点は発行元の会社または税務署にご確認ください。'
  }

  if (q.includes('経費') || q.includes('業務委託') || q.includes('フリーランス')) {
    return '業務委託・フリーランスの経費についてお答えします。\n\n📋 経費として認められる主なもの\n✅ 交通費（業務に直接関わるもの）\n✅ 通信費（仕事で使う割合分）\n✅ PC・機材費（仕事で使うもの）\n✅ 書籍・セミナー費用（業務関連）\n✅ 消耗品費（仕事で使う文具等）\n\n📋 注意点\n・領収書・レシートを必ず保管してください\n・プライベートと兼用の場合は按分が必要です\n・経費 = 収入から差し引ける金額です\n\n⚠️ 経費の判断は税務署または税理士にご相談ください。'
  }

  if (q.includes('還付') || q.includes('振り込み') || q.includes('いつ')) {
    return '還付金の振り込み時期についてお答えします。\n\n📋 e-Tax（電子申告）の場合\n申告後おおよそ3週間で振り込まれます。\n\n📋 書面申告の場合\n申告後1〜2か月で振り込まれます。\n\n📋 振込先\n申告書に記載した銀行口座に振り込まれます。事前に口座情報を確認しておきましょう。\n\n📋 還付申告の期限\n1月1日から5年間いつでも申告できます。期限を過ぎると還付を受けられなくなります。\n\n⚠️ 具体的な時期は税務署にご確認ください。'
  }

  if (q.includes('e-Tax') || q.includes('etax') || q.includes('電子申告')) {
    return 'e-Taxの使い方についてお答えします。\n\n📋 e-Taxとは\n国税庁が提供するインターネットで確定申告できるサービスです。\n\n📋 必要なもの\n・マイナンバーカード\n・ICカードリーダーまたはスマートフォン\n\n📋 手順\n① 国税庁「確定申告書等作成コーナー」にアクセス\n② マイナンバーカードでログイン\n③ 案内に従って収入・控除を入力\n④ 内容を確認して送信\n\n📋 メリット\n・24時間365日申告可能\n・還付金の処理が書面より早い\n・添付書類の一部省略可能\n\n⚠️ 詳しくは国税庁のサイトをご確認ください。'
  }

  return 'ご質問ありがとうございます。確定申告についての詳細は、国税庁のサイトや税務署への相談をおすすめします。\n\nこのアプリの「ケース別ガイド」や「確定申告診断」も参考にしてみてください。\n\n⚠️ 本アプリの情報はあくまで参考情報です。最終的な判断は税務署または税理士にご相談ください。'
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
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">{NavIcons.diagnose}</div>
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
              item.id === 'chat'
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
        <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-slate-300 transition-colors">{NavIcons.logout}</button>
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
            item.id === 'chat' ? 'text-sky-500' : 'text-gray-400'
          }`}>
          {item.icon}
          <span>{item.label}</span>
          {item.id === 'chat' && <span className="w-1 h-1 rounded-full bg-sky-500" />}
        </button>
      ))}
    </div>
  )
}

// ── メッセージバブル ─────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-auto">
          <span className="text-white text-xs">🤖</span>
        </div>
      )}
      <div className={`max-w-xs md:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-slate-800 text-white rounded-br-sm'
          : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
      }`}>
        {message.text}
      </div>
    </div>
  )
}

// ── ローディングバブル ───────────────────────────────────
function LoadingBubble() {
  return (
    <div className="flex gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs">🤖</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── チャット本体 ─────────────────────────────────────────
function ChatBody({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'こんにちは！確定申告ナビAIです。\n\n確定申告に関するご質問にお答えします。下のクイック質問からお選びいただくか、自由に入力してください。\n\n⚠️ 回答はあくまで参考情報です。正確な判断は税務署または税理士にご相談ください。',
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [count, setCount]       = useState(0)
  const [showQuick, setShowQuick] = useState(true)
  const MAX = 10
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    const q = text.trim()
    if (!q || loading || count >= MAX) return

    setInput('')
    setShowQuick(false)
    setCount((c) => c + 1)
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: q }])
    setLoading(true)

    // デモ用：1秒後にレスポンス（実際はAPI呼び出し）
    await new Promise((r) => setTimeout(r, 1000))
    const reply = getDemoResponse(q)
    setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }])
    setLoading(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* クイック質問 */}
        {showQuick && (
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-xs font-medium hover:bg-sky-100 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {loading && <LoadingBubble />}

        {/* 上限到達 */}
        {count >= MAX && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-amber-700 text-sm font-semibold mb-1">本日の質問上限に達しました</p>
            <p className="text-amber-600 text-xs">ケース別ガイドや診断フローもご活用ください。</p>
            <button onClick={() => onNavigate('guide')}
              className="mt-3 px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">
              ガイドを見る
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 免責事項 */}
      <p className="text-gray-400 text-xs text-center py-2 border-t border-gray-100">
        ⚠️ 回答は参考情報です。税務判断は専門家にご相談ください。
      </p>

      {/* 入力エリア */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(input)
            }
          }}
          placeholder={count >= MAX ? '本日の上限に達しました' : '確定申告について質問する...'}
          disabled={count >= MAX || loading}
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-sky-400 placeholder-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
          style={{ maxHeight: 96 }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || count >= MAX}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {NavIcons.send}
        </button>
      </div>
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────
export default function ChatScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden h-screen bg-gray-100 flex flex-col">

        {/* ヘッダー */}
        <div className="bg-slate-800 px-5 pt-14 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('home')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
                {NavIcons.back}
              </button>
              <div>
                <h1 className="text-white text-lg font-bold">AIチャット</h1>
                <p className="text-slate-400 text-xs">確定申告の疑問を解決</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-700 rounded-full border border-slate-600">
              <span className="text-slate-300 text-xs">残り10回</span>
            </div>
          </div>
        </div>

        <ChatBody onNavigate={onNavigate} />

        <div className="pb-16">
          <BottomNav onNavigate={onNavigate} />
        </div>
      </div>

      {/* ══ デスクトップ表示 ══ */}
<div className="hidden md:flex h-screen bg-gray-100">
  <Sidebar onNavigate={onNavigate} />
  <div className="flex-1 flex flex-col overflow-hidden">

    {/* ページヘッダー */}
    <div className="flex items-center justify-between px-8 py-5 bg-slate-800 border-b border-slate-700 flex-shrink-0">
      <div>
        <h2 className="text-white text-xl font-bold">AIチャット</h2>
        <p className="text-slate-400 text-sm mt-0.5">確定申告の疑問をAIに質問する</p>
      </div>
      <div className="px-4 py-2 bg-slate-700 rounded-xl border border-slate-600">
        <span className="text-slate-300 text-sm">1日10回まで利用可能</span>
      </div>
    </div>

    {/* コンテンツ（2カラム） */}
    <div className="flex-1 flex overflow-hidden p-6 gap-6">

      {/* 左：チャット（3/5） */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <ChatBody onNavigate={onNavigate} />
      </div>

      {/* 右：ヒント・リンク（2/5） */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">

        {/* よくある質問 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">よくある質問</p>
          <div className="flex flex-col gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q}
                className="text-left text-xs text-sky-600 hover:text-sky-800 py-1.5 border-b border-gray-100 last:border-0 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 関連リンク */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">関連機能</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => onNavigate('diagnose')}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
              <span className="text-lg">📋</span>
              <div>
                <p className="text-gray-700 text-xs font-semibold">確定申告診断</p>
                <p className="text-gray-400 text-xs">申告が必要か7STEPで診断</p>
              </div>
            </button>
            <button onClick={() => onNavigate('guide')}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
              <span className="text-lg">📚</span>
              <div>
                <p className="text-gray-700 text-xs font-semibold">ケース別ガイド</p>
                <p className="text-gray-400 text-xs">状況別の申告手順を確認</p>
              </div>
            </button>
            <button onClick={() => onNavigate('check')}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-gray-700 text-xs font-semibold">書類チェックリスト</p>
                <p className="text-gray-400 text-xs">必要書類を確認する</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-gray-400 text-xs text-center leading-relaxed">
          ※ AIの回答は参考情報です。<br />最終的な判断は税務署または税理士にご相談ください。
        </p>
      </div>
    </div>
  </div>
</div>
    </>
  )
}