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
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import RecordScreen from './screens/record/RecordScreen'
import DiagnosisScreen from './screens/diagnosis/DiagnosisScreen'
import GuideScreen from './screens/guide/GuideScreen'
import ChecklistScreen from './screens/checklist/ChecklistScreen'
import ChatScreen from './screens/ai-chat/ChatScreen'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<ScreenId>('home')

  const navigate = useCallback((next: string) => {
    if (!isScreenId(next)) {
      console.warn(`未知の画面ID: ${next}`)
      return
    }
    setScreen(next)
  }, [])

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
    if (!user) return
    trackScreenView(screen)
  }, [screen, user])

  useEffect(() => {
    if (!loading && !user) trackScreenView('login')
  }, [loading, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">読み込み中...</p>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  switch (screen) {
    case 'chat':     return <ChatScreen onNavigate={navigate} />
    case 'check':    return <ChecklistScreen onNavigate={navigate} />
    case 'guide':    return <GuideScreen onNavigate={navigate} />
    case 'diagnose': return <DiagnosisScreen onNavigate={navigate} />
    case 'record':   return <RecordScreen onNavigate={navigate} />
    case 'home':     return <HomeScreen onNavigate={navigate} />
  }
}

export default App
