import { useChecklist } from '../../hooks/useChecklist'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import { Icons } from '../../components/Icons'
import { trackEvent, AnalyticsEvents } from '../../lib/analytics'


// ── チェックリストデータ ─────────────────────────────────
interface CheckItem {
  id:       string
  label:    string
  sub:      string
  required: boolean
}

interface CheckCategory {
  id:    string
  emoji: string
  label: string
  items: CheckItem[]
}

const CATEGORIES: CheckCategory[] = [
  {
    id: 'income', emoji: '📄', label: '収入の証明書類',
    items: [
      { id:'gensen',    label:'源泉徴収票',           sub:'バイト先・勤務先から受け取る（全勤務先分）',   required: true  },
      { id:'invoice',   label:'支払調書',              sub:'業務委託・フリーランスの場合（取引先から）',   required: false },
      { id:'flea_hist', label:'フリマの取引履歴',      sub:'メルカリ・ヤフオク等（CSVでダウンロード）',    required: false },
    ],
  },
  {
    id: 'deduction', emoji: '📋', label: '控除関連書類',
    items: [
      { id:'nenkin',     label:'国民年金保険料の控除証明書', sub:'日本年金機構から10〜11月に郵送される',        required: false },
      { id:'kokuho',     label:'国民健康保険料の支払い証明', sub:'自治体の納付書または通知書で確認',            required: false },
      { id:'life_ins',   label:'生命保険料控除証明書',       sub:'保険会社から10月頃に郵送される',              required: false },
      { id:'medical',    label:'医療費の領収書・明細書',     sub:'年間10万円超の医療費がある場合（交通費含む）', required: false },
      { id:'furusato',   label:'寄附金受領証明書',           sub:'ふるさと納税等を行った場合',                  required: false },
      { id:'disability', label:'障害者手帳',                 sub:'障害者控除を申請する場合',                    required: false },
    ],
  },
  {
    id: 'identity', emoji: '🪪', label: '本人確認書類',
    items: [
      { id:'mynum',    label:'マイナンバーカード', sub:'e-Taxでの申告に必要・最も便利',            required: true },
      { id:'bankbook', label:'銀行口座情報',       sub:'還付金の振込先として必要（通帳またはメモ）', required: true },
    ],
  },
  {
    id: 'expense', emoji: '🧾', label: '経費の証明書類（業務委託・フリマの場合）',
    items: [
      { id:'receipt',   label:'領収書・レシート', sub:'業務に関わる経費の証明（交通費・通信費・機材費等）', required: false },
      { id:'transport', label:'交通費の記録',     sub:'業務で使用した交通費の日付・区間・金額の記録',       required: false },
      { id:'comm_bill', label:'通信費の請求書',   sub:'仕事で使用した割合分を按分して経費計上',             required: false },
    ],
  },
]



// ── 進捗バー ─────────────────────────────────────────────
function ProgressBar({ checked, total, required, requiredDone }: {
  checked: number; total: number; required: number; requiredDone: number
}) {
  const pct             = total === 0 ? 0 : Math.round((checked / total) * 100)
  const allRequiredDone = requiredDone === required

  return (
    <div className="bg-white border-b border-gray-200 px-5 py-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">
          必須書類 <span className={allRequiredDone ? 'text-teal-600 font-bold' : 'text-gray-700 font-bold'}>{requiredDone}/{required}</span> 完了
        </span>
        <span className="text-xs text-gray-400">全体 {checked}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${allRequiredDone ? 'bg-teal-500' : 'bg-sky-500'}`}
          style={{ width:`${pct}%` }} />
      </div>
      {allRequiredDone && checked > 0 && (
        <p className="text-teal-600 text-xs font-semibold mt-1.5">✅ 必須書類がすべて揃いました！</p>
      )}
    </div>
  )
}

// ── チェックアイテム ─────────────────────────────────────
function CheckItemRow({ item, checked, onToggle }: {
  item: CheckItem; checked: boolean; onToggle: () => void
}) {
  return (
    <button onClick={onToggle}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
        checked ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
      <div className={`w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
      }`}>
        {checked && (
          <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${checked ? 'text-teal-700 line-through' : 'text-gray-800'}`}>
            {item.label}
          </p>
          {item.required && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-medium flex-shrink-0">
              必須
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
      </div>
    </button>
  )
}

// ── メインコンポーネント ─────────────────────────────────
export default function ChecklistScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const allItems = CATEGORIES.flatMap((c) => c.items)
  const { checkedIds, loading, toggle: toggleItem, reset: resetItems } = useChecklist()

  const toggle = (id: string) => {
    trackEvent(AnalyticsEvents.checklistToggled, {
      item_id: id,
      checked: !checkedIds.has(id),
    })
    return toggleItem(id)
  }

  const reset = () => {
    trackEvent(AnalyticsEvents.checklistReset)
    return resetItems()
  }

  const checkedCount      = checkedIds.size
  const totalCount        = allItems.length
  const requiredItems     = allItems.filter((i) => i.required)
  const requiredDoneCount = requiredItems.filter((i) => checkedIds.has(i.id)).length

  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden min-h-screen bg-gray-100 flex flex-col">

        {/* ヘッダー */}
        <div className="bg-slate-800 px-5 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate('home')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
                {Icons.back}
              </button>
              <div>
                <h1 className="text-white text-lg font-bold">書類チェックリスト</h1>
                <p className="text-slate-400 text-xs">必要書類をすべて揃えましょう</p>
              </div>
            </div>
            <button onClick={reset} className="text-slate-400 text-xs hover:text-slate-200 transition-colors">
              リセット
            </button>
          </div>
        </div>

        {/* 進捗バー */}
        <ProgressBar
          checked={checkedCount} total={totalCount}
          required={requiredItems.length} requiredDone={requiredDoneCount}
        />

        {/* リスト */}
        <div className="flex-1 overflow-auto px-4 py-4 pb-24">
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-12">読み込み中...</p>
          ) : (
            <>
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <p className="text-sm font-bold text-gray-700">{cat.label}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cat.items.map((item) => (
                      <CheckItemRow
                        key={item.id} item={item}
                        checked={checkedIds.has(item.id)}
                        onToggle={() => toggle(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <p className="text-amber-700 text-xs font-semibold mb-1">📁 書類の保管期間</p>
                <p className="text-amber-600 text-xs leading-relaxed">
                  確定申告に使用した書類は5年間保管する義務があります。領収書・源泉徴収票はファイルにまとめて保管しましょう。
                </p>
              </div>

              <p className="text-gray-400 text-xs text-center leading-relaxed pb-2">
                ※ 本アプリの情報は参考情報です。<br />最終的な判断は税務署または税理士にご相談ください。
              </p>
            </>
          )}
        </div>

        <BottomNav active="check" onNavigate={onNavigate} />
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex h-screen bg-gray-100">
        <Sidebar active="check" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col overflow-auto">

          {/* ページヘッダー */}
          <div className="flex items-center justify-between px-8 py-5 bg-slate-800 border-b border-slate-700">
            <div>
              <h2 className="text-white text-xl font-bold">書類チェックリスト</h2>
              <p className="text-slate-400 text-sm mt-0.5">必要書類をすべて揃えましょう</p>
            </div>
            <button onClick={reset}
              className="text-slate-400 hover:text-slate-200 text-sm border border-slate-600 px-4 py-2 rounded-xl transition-colors">
              リセット
            </button>
          </div>

          {/* 進捗バー */}
          <ProgressBar
            checked={checkedCount} total={totalCount}
            required={requiredItems.length} requiredDone={requiredDoneCount}
          />

          {/* コンテンツ */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-5xl grid grid-cols-5 gap-8">

              {/* 左：チェックリスト（3/5） */}
              <div className="col-span-3 flex flex-col gap-6">
                {loading ? (
                  <p className="text-gray-400 text-sm text-center py-12">読み込み中...</p>
                ) : (
                  CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{cat.emoji}</span>
                        <p className="text-sm font-bold text-gray-700">{cat.label}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {cat.items.map((item) => (
                          <CheckItemRow
                            key={item.id} item={item}
                            checked={checkedIds.has(item.id)}
                            onToggle={() => toggle(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 右：進捗・メモ（2/5） */}
              <div className="col-span-2 flex flex-col gap-4">

                {/* 進捗サマリー */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">準備状況</p>
                  <div className="flex flex-col gap-3">
                    {CATEGORIES.map((cat) => {
                      const done  = cat.items.filter((i) => checkedIds.has(i.id)).length
                      const total = cat.items.length
                      const pct   = Math.round((done / total) * 100)
                      return (
                        <div key={cat.id}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-600">{cat.emoji} {cat.label}</span>
                            <span className="text-xs text-gray-400">{done}/{total}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${done === total ? 'bg-teal-500' : 'bg-sky-400'}`}
                              style={{ width:`${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 書類保管メモ */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <p className="text-amber-700 text-xs font-semibold mb-2">📁 書類の保管期間</p>
                  <p className="text-amber-600 text-xs leading-relaxed">
                    確定申告に使用した書類は5年間保管する義務があります。領収書・源泉徴収票はファイルにまとめて保管しましょう。
                  </p>
                </div>

                {/* 次のステップ */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">次のステップ</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => onNavigate('diagnose')}
                      className="w-full py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                      確定申告診断へ
                    </button>
                    <button onClick={() => onNavigate('guide')}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      ケース別ガイドへ
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 text-xs text-center leading-relaxed">
                  ※ 本アプリの情報は参考情報です。<br />最終的な判断は税務署または税理士にご相談ください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}