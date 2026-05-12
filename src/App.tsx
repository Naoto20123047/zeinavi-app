import { useEffect, useState } from 'react'
import { auth } from './lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import LoginScreen from './screens/LoginScreen'

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-white">読み込み中...</p>
    </div>
  )

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl font-bold">ログイン成功！</p>
        <p className="text-slate-400 text-sm mt-2">{user.email}</p>
        <button
          onClick={() => auth.signOut()}
          className="mt-4 text-sky-400 text-sm"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}

export default App