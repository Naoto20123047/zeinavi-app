import { useEffect, useState } from 'react'
import { auth } from './lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import RecordScreen from './screens/record/RecordScreen'
import DiagnosisScreen from './screens/diagnosis/DiagnosisScreen'
import GuideScreen from './screens/guide/GuideScreen'

type Screen = 'home' | 'record' | 'diagnose' | 'guide' | 'check' | 'chat'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<Screen>('home')

  const navigate = (s: string) => {
    setScreen(s as Screen)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-white">読み込み中...</p>
    </div>
  )

  if (!user) return <LoginScreen />

  switch (screen) {
    case 'guide': return <GuideScreen onNavigate={navigate} />
    case 'diagnose': return <DiagnosisScreen onNavigate={navigate} />
    case 'record': return <RecordScreen onNavigate={navigate} />
    default:       return <HomeScreen onNavigate={navigate} />
  }
}

export default App