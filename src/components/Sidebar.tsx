// サイドバー（デスクトップ表示）
import { auth } from '../lib/firebase'
import { trackEvent, AnalyticsEvents } from '../lib/analytics'
import { Icons } from './Icons'
import { NAV_ITEMS, type ScreenId } from './navigation'

interface SidebarProps {
  active: ScreenId
  onNavigate: (screen: string) => void
  /** 渡した画面だけパスワード変更を表示する（Googleログインのユーザーは対象外） */
  onPasswordChange?: () => void
  subtitle?: string
}

export default function Sidebar({
  active,
  onNavigate,
  onPasswordChange,
  subtitle = '学生向け PWA',
}: SidebarProps) {
  const email = auth.currentUser?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  const isGoogleUser =
    auth.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false
  const showPasswordChange = Boolean(onPasswordChange) && !isGoogleUser

  const handleSignOut = async () => {
    trackEvent(AnalyticsEvents.logout)
    await auth.signOut()
  }

  return (
    <div className="w-56 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
          {Icons.diagnose}
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-none">確定申告ナビ</p>
          <p className="text-sky-400 text-xs">{subtitle}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-slate-500 text-xs font-semibold px-3 mb-2 tracking-wider">MENU</p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={active === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              active === item.id
                ? 'bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border-l-2 border-transparent'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-700 pt-4 px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initial}</span>
          </div>
          <p className="text-slate-400 text-xs flex-1 truncate">{email}</p>
        </div>

        {showPasswordChange && (
          <button
            type="button"
            onClick={onPasswordChange}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-xs transition-colors mb-1"
          >
            {Icons.key}
            パスワードを変更
          </button>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-xs transition-colors"
        >
          {Icons.logout}
          ログアウト
        </button>
      </div>
    </div>
  )
}
