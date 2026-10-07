import { useCallback, useEffect, useState } from 'react'
import { auth } from './lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import {
  setAnalyticsUser,
  trackScreenView,
  trackEvent,
  AnalyticsEvents,
} from './lib/analytics'
import { isScreenId, type ScreenId } from './components/navigation'
import { useProfile } from './hooks/useProfile'
import type { Profile } from './types/profile'
import LoginScreen from './screens/LoginScreen'
import OnboardingScreen from './screens/onboarding/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'
import RecordScreen from './screens/record/RecordScreen'
import DiagnosisScreen from './screens/diagnosis/DiagnosisScreen'
import GuideScreen from './screens/guide/GuideScreen'
import ChecklistScreen from './screens/checklist/ChecklistScreen'
import ChatScreen from './screens/ai-chat/ChatScreen'

function Loading() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <p className="text-white">読み込み中...</p>
    </div>
  )
}

/** ログイン後の画面（プロフィールの読み込みはここで行う） */
function SignedInApp() {
  const [screen, setScreen] = useState<ScreenId>('home')
  const [skippedOnboarding, setSkippedOnboarding] = useState(false)
  const { profile, loading, saveProfile } = useProfile()

  const navigate = useCallback((next: string) => {
    if (!isScreenId(next)) {
      console.warn(`未知の画面ID: ${next}`)
      return
    }
    setScreen(next)
  }, [])

  useEffect(() => {
    trackScreenView(screen)
  }, [screen])

  const handleSave = async (p: Profile) => {
    try {
      await saveProfile(p)
    } catch (e) {
      // 保存に失敗しても、入力内容でこのまま使えるようにする
      console.error('プロフィールの保存に失敗しました', e)
    }
    setScreen('home')
  }

  if (loading) return <Loading />

  // 初回はプロフィール登録から始める（「あとで」を選んだときは、このセッション中は出さない）
  if (!profile.onboardingDone && !skippedOnboarding) {
    return (
      <OnboardingScreen
        initial={profile}
        mode="first"
        onSave={handleSave}
        onSkip={() => setSkippedOnboarding(true)}
      />
    )
  }

  switch (screen) {
    case 'profile':
      return <OnboardingScreen initial={profile} mode="edit" onSave={handleSave} onSkip={() => setScreen('home')} />
    case 'chat':     return <ChatScreen onNavigate={navigate} />
    case 'check':    return <ChecklistScreen onNavigate={navigate} />
    case 'guide':    return <GuideScreen onNavigate={navigate} />
    case 'diagnose': return <DiagnosisScreen onNavigate={navigate} profile={profile} />
    case 'record':   return <RecordScreen onNavigate={navigate} />
    case 'home':     return <HomeScreen onNavigate={navigate} profile={profile} />
  }
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      // uid のみを渡す。メールアドレス等の個人情報は送らない
      setAnalyticsUser(u?.uid ?? null)
      if (u) {
        trackEvent(AnalyticsEvents.login, {
          method: u.providerData[0]?.providerId ?? 'unknown',
        })
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!loading && !user) trackScreenView('login')
  }, [loading, user])

  if (loading) return <Loading />
  if (!user) return <LoginScreen />
  // uid ごとに作り直し、別アカウントのプロフィールが残らないようにする
  return <SignedInApp key={user.uid} />
}

export default App
