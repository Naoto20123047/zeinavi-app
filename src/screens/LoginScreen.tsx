import { useState } from 'react'
import { auth } from '../lib/firebase'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { trackEvent, AnalyticsEvents } from '../lib/analytics'

/** Firebase Auth の最小パスワード長 */
const MIN_PASSWORD_LENGTH = 6

const provider = new GoogleAuthProvider()

// ── フォーム部分（モバイル・デスクトップ共通） ──────────
function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setError('')
    try {
      await signInWithPopup(auth, provider)
    } catch {
      setError('Googleログインに失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください')
      return
    }
    if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください`)
      return
    }
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        trackEvent(AnalyticsEvents.signUp, { method: 'password' })
      }
    } catch {
      setError(
        mode === 'login'
          ? 'メールアドレスまたはパスワードが正しくありません'
          : 'アカウントの作成に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* タブ */}
      <div className="flex bg-slate-700/60 rounded-xl p-1 mb-6">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {m === 'login' ? 'ログイン' : '新規登録'}
          </button>
        ))}
      </div>

      {/* Googleログイン */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-3 text-sm mb-4 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Googleでログイン
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-600" />
        <span className="text-slate-500 text-xs">または</span>
        <div className="flex-1 h-px bg-slate-600" />
      </div>

      {/* メールフォーム */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-700/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
        />
        <input
          type="password"
          placeholder={`パスワード（${MIN_PASSWORD_LENGTH}文字以上）`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="w-full bg-slate-700/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
        />

        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl py-3 text-sm mt-1 disabled:opacity-50 transition-colors"
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
        </button>
      </form>

      <p className="text-slate-500 text-xs text-center mt-6">
        ログインすることで
        <span className="text-slate-400 underline cursor-pointer mx-1">利用規約</span>
        および
        <span className="text-slate-400 underline cursor-pointer mx-1">プライバシーポリシー</span>
        に同意したものとみなします。
      </p>
    </div>
  )
}

// ── メインコンポーネント ────────────────────────────────
export default function LoginScreen() {
  return (
    <>
      {/* ── モバイル表示 ── */}
      <div className="md:hidden min-h-screen bg-slate-900 flex flex-col justify-between px-6 py-12">
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📋</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-1">確定申告ナビ</h1>
          <p className="text-slate-400 text-sm">税知識ゼロでも、必要な申告がわかる</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <LoginForm />
        </div>
      </div>

      {/* ── デスクトップ表示（左右2カラム） ── */}
      <div className="hidden md:flex min-h-screen">

        {/* 左パネル：ブランディング */}
        <div className="w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col justify-between p-12 border-r border-slate-700">
          {/* ロゴ */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">確定申告ナビ</p>
            </div>
          </div>

          {/* メインコピー */}
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              税知識ゼロでも<br />
              <span className="text-sky-400">自分に必要な申告</span>がわかる
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              バイト・業務委託・フリマ収入がある学生向けに、
              確定申告が必要かどうかを7つの質問で診断。
              還付金を受け取り損ねている学生を0に。
            </p>
          </div>

          {/* 特徴リスト */}
          <div className="flex flex-col gap-4">
            {[
              { icon: '📋', title: '申告必要か診断', desc: '7つの質問で即判定' },
              { icon: '📚', title: 'ケース別ガイド', desc: 'バイト・業務委託・フリマに対応' },
              { icon: '🤖', title: 'AIチャット', desc: '確定申告の疑問をすぐ解決' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{f.icon}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-slate-400 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右パネル：ログインフォーム */}
        <div className="w-1/2 bg-slate-900 flex items-center justify-center p-12">
          <div className="w-full max-w-sm">
            <h3 className="text-white text-2xl font-bold mb-2">ログイン</h3>
            <p className="text-slate-400 text-sm mb-8">
              アカウントにログインして申告診断を始めましょう
            </p>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}