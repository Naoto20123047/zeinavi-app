import { auth, db } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log('Firebase接続OK:', user)
    })
    return () => unsub()
  }, [])

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center">
      <h1 className="text-white text-3xl font-bold">確定申告ナビ</h1>
    </div>
  )
}

export default App