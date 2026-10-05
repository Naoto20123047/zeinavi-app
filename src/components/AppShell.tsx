// 画面の外枠：PCは左にサイドバー、スマホは下にボトムナビ
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import type { ScreenId } from './navigation'

export default function AppShell({ active, onNavigate, children, hideBottomNav, onPasswordChange }: {
  active: ScreenId
  onNavigate: (s: string) => void
  children: ReactNode
  hideBottomNav?: boolean
  onPasswordChange?: () => void
}) {
  return (
    <div className="min-h-screen bg-paper md:flex">
      <div className="hidden md:block">
        <Sidebar active={active} onNavigate={onNavigate} onPasswordChange={onPasswordChange} />
      </div>
      <div className={`flex-1 min-w-0 flex flex-col ${hideBottomNav ? '' : 'pb-24 md:pb-0'}`}>
        {children}
      </div>
      {!hideBottomNav && <BottomNav active={active} onNavigate={onNavigate} />}
    </div>
  )
}
