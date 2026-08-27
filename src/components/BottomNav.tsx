// ボトムナビゲーション（モバイル表示）
import { BOTTOM_NAV_ITEMS, type ScreenId } from './navigation'

interface BottomNavProps {
  active: ScreenId
  onNavigate: (screen: string) => void
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
            active === item.id ? 'text-sky-500' : 'text-gray-400'
          }`}
        >
          {item.icon}
          <span>{item.shortLabel}</span>
          {active === item.id && <span className="w-1 h-1 rounded-full bg-sky-500" />}
        </button>
      ))}
    </nav>
  )
}
