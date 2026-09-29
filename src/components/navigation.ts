// メニューを増やすときはここだけを変更すればよい
import type { ReactNode } from 'react'
import { Icons } from './Icons'

export const SCREENS = ['home', 'diagnose', 'record', 'guide', 'check', 'chat'] as const
export type ScreenId = (typeof SCREENS)[number]

export function isScreenId(value: string): value is ScreenId {
  return (SCREENS as readonly string[]).includes(value)
}

export interface NavItem {
  id: ScreenId
  /** サイドバー用 */
  label: string
  /** ボトムナビ用 */
  shortLabel: string
  icon: ReactNode
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home',     label: 'ホーム',         shortLabel: 'ホーム',     icon: Icons.home },
  { id: 'diagnose', label: '確定申告診断',   shortLabel: '診断',       icon: Icons.diagnose },
  { id: 'guide',    label: 'ケース別ガイド', shortLabel: 'ガイド',     icon: Icons.book },
  { id: 'check',    label: '書類チェック',   shortLabel: 'チェック',   icon: Icons.check },
  { id: 'chat',     label: 'AIチャット',     shortLabel: 'AIチャット', icon: Icons.chat },
  { id: 'record',   label: '収入・経費記録', shortLabel: '記録',       icon: Icons.record },
]

export const BOTTOM_NAV_ORDER: ScreenId[] = ['home', 'diagnose', 'record', 'guide', 'chat']

export const BOTTOM_NAV_ITEMS: NavItem[] = BOTTOM_NAV_ORDER
  .map((id) => NAV_ITEMS.find((item) => item.id === id))
  .filter((item): item is NavItem => item !== undefined)
