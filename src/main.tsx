import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'

// 描画を止めないため await しない
void initAnalytics()

const container = document.getElementById('root')
if (!container) throw new Error('#root 要素が見つかりません')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
