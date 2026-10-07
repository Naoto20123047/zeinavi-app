import { useState, useRef, useEffect } from 'react'
import { askTaxAssistant, toUserMessage, MAX_INPUT_LENGTH } from '../../lib/ai'
import { useChatUsage } from '../../hooks/useChatUsage'
import { trackEvent, AnalyticsEvents } from '../../lib/analytics'
import { CHAT_DAILY_LIMIT, WALL_LABELS } from '../../config/taxConfig'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import { Icons } from '../../components/Icons'


// ── 型定義 ───────────────────────────────────────────────
interface Message {
  id:   number
  role: 'user' | 'assistant'
  text: string
  /** エラー通知の吹き出し。会話履歴としてAIには渡さない */
  isError?: boolean
}

/**
 * 失敗したやり取り（エラー文とその質問）は、AIが自分の発言だと誤解して
 * 謝り続ける原因になるため履歴から除外する。
 */
function toHistory(messages: Message[]): Message[] {
  const result: Message[] = []
  for (const message of messages) {
    if (message.isError) {
      if (result.at(-1)?.role === 'user') result.pop()
      continue
    }
    result.push(message)
  }
  return result
}

// ── クイック質問 ─────────────────────────────────────────
const QUICK_QUESTIONS = [
  `${WALL_LABELS.incomeTax}の壁とは何ですか？`,
  '掛け持ちバイトの申告方法は？',
  '源泉徴収票の見方を教えて',
  '業務委託の経費にできるものは？',
  '還付金はいつ振り込まれますか？',
  'e-Taxの使い方を教えて',
]




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
    text: '確定申告ナビのAIです。\n\n確定申告や税金の言葉について、わかりやすくお答えします。下の質問例を選ぶか、自由に入力してください。\n\n回答は参考情報です。具体的な判断は、税務署または税理士にご確認ください。',
  }

  const [messages,  setMessages]  = useState<Message[]>([INITIAL_MESSAGE])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [retrying,  setRetrying]  = useState(false)
  const [waitSec,   setWaitSec]   = useState<number | undefined>(undefined)
  const [showQuick, setShowQuick] = useState(true)
  const { loading: usageLoading, increment, remaining, isLimit } = useChatUsage()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string, isQuickQuestion = false) => {
    const q = text.trim()
    if (!q || loading || isLimit || usageLoading) return

    if (q.length > MAX_INPUT_LENGTH) {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'assistant',
        text: `質問は${MAX_INPUT_LENGTH}文字以内で入力してください。`,
        isError: true,
      }])
      return
    }

    setInput('')
    setShowQuick(false)
    setRetrying(false)
    setWaitSec(undefined)

    const userMsg: Message = { id: Date.now(), role: 'user', text: q }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // 質問文そのものは GA に送らず、長さのみ計測する
    trackEvent(AnalyticsEvents.chatMessageSent, {
      length: q.length,
      is_quick_question: isQuickQuestion,
    })
    if (isQuickQuestion) {
      trackEvent(AnalyticsEvents.quickQuestionUsed, { question: q })
    }

    try {
      const reply = await askTaxAssistant(q, toHistory(messages), (sec) => {
        setRetrying(true)
        setWaitSec(sec)
      })
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }])
      // 回答を得られたときだけ消費する
      await increment()
      if (remaining - 1 <= 0) trackEvent(AnalyticsEvents.chatLimitReached)
    } catch (e: unknown) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: `申し訳ありません。${toUserMessage(e)}`,
        isError: true,
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
              <button key={q} onClick={() => sendMessage(q, true)}
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
        <p className="text-gray-400 text-xs">回答は参考情報です。具体的な判断は専門家にご確認ください。</p>
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
          {Icons.send}
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
                {Icons.back}
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
          <BottomNav active="chat" onNavigate={onNavigate} />
        </div>
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex h-screen bg-gray-100">
        <Sidebar active="chat" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ページヘッダー */}
          <div className="flex items-center justify-between px-8 py-5 bg-slate-800 border-b border-slate-700 flex-shrink-0">
            <div>
              <h2 className="text-white text-xl font-bold">AIチャット</h2>
              <p className="text-slate-400 text-sm mt-0.5">確定申告の疑問をAIに質問する</p>
            </div>
            <div className="px-4 py-2 bg-slate-700 rounded-xl border border-slate-600">
              <span className="text-slate-300 text-sm">{`Gemini 2.5 Flash\u30001日${CHAT_DAILY_LIMIT}回まで`}</span>
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