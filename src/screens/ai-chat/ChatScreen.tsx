import { useState, useRef, useEffect } from 'react'
import { auth } from '../../lib/firebase'
import { useChatUsage } from '../../hooks/useChatUsage'

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

// ── システムプロンプト ────────────────────────────────────
const SYSTEM_PROMPT = `日本の確定申告AIアシスタントです。学生のバイト・業務委託・フリマ収入に関する質問に簡潔に答えます。2026年税制：所得税の壁178万円、住民税110万円、社保130万円。末尾に必ず「⚠️ 具体的な判断は税務署または税理士にご相談ください。」を付けること。確定申告と無関係な質問は断ること。日本語で回答すること。`

// ── Gemini API呼び出し ────────────────────────────────────
async function callGeminiAPI(
  userMessage: string,
  history: Message[],
  onRetry: (waitSec: number) => void
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('APIキーが設定されていません')

  const recentHistory = history.slice(-3)

  const contents = [
    { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'はい、確定申告に関するご質問にお答えします。' }] },
    ...recentHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const MAX_RETRY = 3

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({ contents }),
      }
    )

    if (res.status === 429 || res.status === 503) {
      const errBody = await res.json().catch(() => ({}))
      console.error('エラー詳細:', JSON.stringify(errBody))

      if (attempt < MAX_RETRY - 1) {
        const retryDelaySec = errBody?.error?.details
          ?.find((d: { retryDelay?: string }) => d.retryDelay)
          ?.retryDelay?.replace('s', '')
        const waitSec = retryDelaySec ? Math.ceil(parseFloat(retryDelaySec)) + 3 : 35
        onRetry(waitSec)
        console.log(`${waitSec}秒後にリトライします`)
        await new Promise((r) => setTimeout(r, waitSec * 1000))
        continue
      }
      throw new Error('しばらく時間をおいてから再度お試しください。')
    }

    if (!res.ok) throw new Error(`APIエラー: ${res.status}`)

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('レスポンスが空です')
    return text
  }

  throw new Error('リクエストに失敗しました。')
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
function LoadingBubble({ retrying, waitSec }: { retrying?: boolean; waitSec?: number }) {
  return (
    <div className="flex gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs">🤖</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        {retrying ? (
          <p className="text-gray-400 text-xs">
            混雑中のため再試行中{waitSec ? `（約${waitSec}秒待機）` : ''}...
          </p>
        ) : (
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── チャット本体 ─────────────────────────────────────────
function ChatBody({ onNavigate }: { onNavigate: (s: string) => void }) {
  const INITIAL_MESSAGE: Message = {
    id: 0,
    role: 'assistant',
    text: 'こんにちは！確定申告ナビAIです。\n\n確定申告に関するご質問にお答えします。下のクイック質問からお選びいただくか、自由に入力してください。\n\n⚠️ 回答はあくまで参考情報です。正確な判断は税務署または税理士にご相談ください。',
  }

  const [messages,  setMessages]  = useState<Message[]>([INITIAL_MESSAGE])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [retrying,  setRetrying]  = useState(false)
  const [waitSec,   setWaitSec]   = useState<number | undefined>(undefined)
  const [showQuick, setShowQuick] = useState(true)
  const {loading: usageLoading, increment, remaining, isLimit } = useChatUsage()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    const q = text.trim()
    if (!q || loading || isLimit || usageLoading) return

    setInput('')
    setShowQuick(false)
    setRetrying(false)
    setWaitSec(undefined)

    const userMsg: Message = { id: Date.now(), role: 'user', text: q }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    await increment()

    try {
      const reply = await callGeminiAPI(q, messages, (sec) => {
        setRetrying(true)
        setWaitSec(sec)
      })
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '回答の取得に失敗しました。'
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: `申し訳ありません。${msg}`,
      }])
    } finally {
      setLoading(false)
      setRetrying(false)
      setWaitSec(undefined)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* クイック質問 */}
        {showQuick && !isLimit && (
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-xs font-medium hover:bg-sky-100 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {loading && <LoadingBubble retrying={retrying} waitSec={waitSec} />}

        {/* 上限到達 */}
        {isLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-amber-700 text-sm font-semibold mb-1">本日の質問上限に達しました</p>
            <p className="text-amber-600 text-xs">明日またご利用ください。ケース別ガイドや診断フローもご活用ください。</p>
            <button onClick={() => onNavigate('guide')}
              className="mt-3 px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">
              ガイドを見る
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 残り回数 + 免責事項 */}
      <div className="border-t border-gray-100 px-4 py-2 flex justify-between items-center">
        <p className="text-gray-400 text-xs">⚠️ 回答は参考情報です。税務判断は専門家にご相談ください。</p>
        {!isLimit && (
          <span className="text-gray-400 text-xs flex-shrink-0">
            {usageLoading ? '...' : `残り${remaining}回`}
          </span>
        )}
      </div>

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
          placeholder={isLimit ? '本日の上限に達しました' : '確定申告について質問する...'}
          disabled={isLimit || loading}
          rows={1}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-sky-400 placeholder-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
          style={{ maxHeight: 96 }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || isLimit}
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
              <span className="text-slate-300 text-xs">Gemini 2.5 Flash</span>
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
              <span className="text-slate-300 text-sm">Gemini 2.5 Flash　1日10回まで</span>
            </div>
          </div>

          {/* コンテンツ（2カラム） */}
          <div className="flex-1 flex overflow-hidden p-6 gap-6">

            {/* 左：チャット */}
            <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <ChatBody onNavigate={onNavigate} />
            </div>

            {/* 右：ヒント・リンク */}
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

              {/* 関連機能 */}
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