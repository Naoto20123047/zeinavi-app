// サイドバー（デスクトップ表示）
import { auth } from '../lib/firebase'
import { trackEvent, AnalyticsEvents } from '../lib/analytics'
import { Icons } from './Icons'
import { NAV_ITEMS, type ScreenId } from './navigation'
import { FILING_DEADLINE_FULL_LABEL, TAX_YEAR } from '../config/taxConfig'
import { daysUntilDeadline } from '../utils/dates'

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
  subtitle = `${TAX_YEAR}年分（令和8年分）`,
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
    <div className="w-[248px] flex-shrink-0 bg-navy-900 text-white flex flex-col px-4 pt-7 pb-5 min-h-screen sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 px-2">
        <svg width="30" height="34" viewBox="0 0 56 64" aria-hidden="true">
          <path d="M6 4h30l14 14v40a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#FFFFFF" />
          <path d="M36 4v12a2 2 0 0 0 2 2h12" fill="#CFE3F3" />
          <path d="M16 38l8 8 16-17" fill="none" stroke="#4AA8E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex flex-col">
          <span className="font-display text-lg font-black">確定申告ナビ</span>
          <span className="text-[11px] text-slate-400">{subtitle}</span>
        </div>
      </div>

      <nav aria-label="メインメニュー" className="flex flex-col gap-1 mt-8">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={active === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-bold text-left transition-colors ${
              active === item.id ? 'bg-navy-700 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="bg-navy-800 rounded-[14px] p-3.5 flex flex-col gap-0.5">
          <span className="text-[11.5px] text-slate-400">申告期限まで</span>
          <span className="font-display text-2xl font-black tabular-nums">{daysUntilDeadline()}<span className="text-[13px] ml-0.5">日</span></span>
          <span className="text-[11px] text-slate-400">{FILING_DEADLINE_FULL_LABEL}</span>
        </div>

        <div className="border-t border-navy-700 pt-3 px-1 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-[34px] h-[34px] rounded-full bg-navy-600 grid place-items-center flex-shrink-0">
              <span className="text-xs font-bold">{initial}</span>
            </div>
            <p className="text-[11px] text-slate-400 flex-1 truncate m-0">{email}</p>
          </div>
          <button type="button" onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 text-xs transition-colors">
            {Icons.user}
            プロフィールを変更
          </button>
          {showPasswordChange && (
            <button type="button" onClick={onPasswordChange}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 text-xs transition-colors">
              {Icons.key}
              パスワードを変更
            </button>
          )}
          <button type="button" onClick={handleSignOut}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 text-xs transition-colors">
            {Icons.logout}
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
