import { useEffect, useState } from 'react'
import { auth } from './lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  return <HomeScreen />
}

export default App