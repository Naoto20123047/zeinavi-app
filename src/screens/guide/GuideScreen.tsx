import { useState, type ReactNode } from 'react'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import { Icons } from '../../components/Icons'
import {
  WALL_LABELS,
  FILING_DEADLINE_LABEL,
} from '../../config/taxConfig'
import { trackEvent, AnalyticsEvents } from '../../lib/analytics'


// ── ガイドデータ ─────────────────────────────────────────
interface GuideStep {
  title: string
  body:  string
}

interface Guide {
  id:           string
  emoji:        ReactNode
  label:        string
  badge:        string
  badgeColor:   string
  badgeBg:      string
  desc:         string
  headerBg:     string
  headerBorder: string
  steps:        GuideStep[]
  notes:        string[]
  docs:         string[]
}

const GUIDES: Guide[] = [
  {
    id: 'part',
    emoji: Icons.record, label: 'アルバイト・パート',
    badge: '給与収入', badgeColor: 'text-teal-700', badgeBg: 'bg-teal-50 border-teal-200',
    desc: '1か所または複数のバイトをしている場合の申告手順',
    headerBg: 'bg-teal-50', headerBorder: 'border-teal-200',
    steps: [
      { title: '源泉徴収票を集める',         body: '年末または退職時にバイト先からもらいます。掛け持ちの場合はすべての勤務先分を集めてください。紛失した場合は会社に再発行を依頼できます。' },
      { title: '確定申告が必要か確認する',   body: `次のどれかに当てはまると申告が必要です。①2か所以上から給料があり、2か所目以降の給料と給料以外の所得の合計が${WALL_LABELS.sideIncome}を超える ②給料以外の所得が${WALL_LABELS.sideIncome}を超える。義務がなくても、年末調整を受けていなければ還付申告で税金が戻ることがあります。診断で確かめられます。` },
      { title: 'e-Taxで申告書を作成する',    body: '国税庁の「確定申告書等作成コーナー」で作成します。源泉徴収票の「支払金額」「源泉徴収税額」などを入力します。マイナンバーカードがあれば、スマホからe-Taxで提出できます。' },
      { title: '申告・納税または還付申請',   body: `申告が必要な人は2月16日〜${FILING_DEADLINE_LABEL}に申告します。還付申告だけの人は、翌年1月1日から5年間申告できます。還付金はe-Taxなら3週間ほど、書面なら1〜2か月ほどで口座に振り込まれます。` },
    ],
    notes: [
      `給料が${WALL_LABELS.incomeTax}以下で所得税が引かれている場合、年末調整を受けていなければ、還付申告で全額戻ることが多いです。`,
      `住民税は、給料が${WALL_LABELS.residentTax}を超えるとかかり始める目安です（市区町村によって少し違います）。所得税の壁とは別です。`,
      '掛け持ちの場合、扶養控除等申告書を出していない勤務先では、高めの税率で所得税が引かれています。確定申告で精算できます。',
    ],
    docs: ['源泉徴収票（全勤務先分）', 'マイナンバーカード（ない場合は番号確認書類と本人確認書類）', '銀行口座情報（還付金の振込先）'],
  },
  {
    id: 'freelance',
    emoji: Icons.diagnose, label: '業務委託・フリーランス',
    badge: '事業所得・雑所得', badgeColor: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200',
    desc: '個人で仕事を請け負っている場合の申告手順',
    headerBg: 'bg-purple-50', headerBorder: 'border-purple-200',
    steps: [
      { title: '収入と経費を整理する',       body: '報酬の合計額を集計し、業務に関わった経費（交通費・通信費・機材費・書籍代等）を整理します。経費の証明として領収書・レシートを必ず保管してください。' },
      { title: '所得を計算する',             body: `所得 ＝ 収入 − 経費 です。給料をもらっている人は、この所得が${WALL_LABELS.sideIncome}を超えると申告が必要です。給料がない人は、所得が基礎控除などの合計を超えて所得税がかかる場合に申告が必要です。` },
      { title: '帳簿を作成する',             body: '収入と経費は日付ごとに記録しておきます。事業として青色申告をすると最大65万円の特別控除がありますが、事前の申請と帳簿付けが必要です。' },
      { title: '確定申告書を作成・提出する', body: '事業所得または雑所得として申告します。e-Taxで作成するのが便利です。経費の内訳も入力します。' },
    ],
    notes: [
      `「${WALL_LABELS.sideIncome}以下なら申告不要」は、給料をもらっている人だけのルールです。住民税の申告は別に必要です。`,
      '継続して事業を行っている場合は「事業所得」、単発の場合は「雑所得」として申告します。',
      '青色申告は、始めたい年の3月15日までに申請が必要です。1月16日以降に開業した場合は、開業から2か月以内です。',
    ],
    docs: ['支払調書（取引先から受け取る）', '経費の領収書・レシート', 'マイナンバーカード', '銀行口座情報'],
  },
  {
    id: 'flea',
    emoji: Icons.book, label: 'フリマ・ネットオークション',
    badge: '雑所得', badgeColor: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200',
    desc: 'メルカリ・ヤフオクなどで収入がある場合の申告手順',
    headerBg: 'bg-amber-50', headerBorder: 'border-amber-200',
    steps: [
      { title: '課税対象か確認する',         body: '自分で使っていた不用品の売却は原則非課税です。仕入れて転売・継続的に販売している場合は課税対象となります。' },
      { title: '利益を計算する',             body: '所得 ＝ 売上 − 仕入れ値 − 送料 − 手数料。メルカリ・ヤフオクの取引履歴からデータをエクスポートして集計します。' },
      { title: '申告が必要か判断する',       body: `給料をもらっている人は、販売などの所得が年間${WALL_LABELS.sideIncome}を超えると確定申告が必要です。給料がない人は、所得税がかかるかどうかで決まります。` },
      { title: '確定申告書を作成・提出する', body: '確定申告書の「雑所得」欄に収入・経費を記入します。給与収入がある場合は合算して申告します。' },
    ],
    notes: [
      '生活用動産（家具・衣類・家電等）の売却は、1個または1組の売却価格が30万円以下なら非課税です。',
      '転売目的で仕入れたものや、継続的に販売している場合は課税対象です。',
      '取引の履歴は、各サービスの画面で確認できます。早めに保存しておくと安心です。',
    ],
    docs: ['フリマ・オークションの取引履歴', '仕入れ時の領収書・レシート', 'マイナンバーカード', '銀行口座情報'],
  },
  {
    id: 'retire',
    emoji: Icons.clock, label: '途中退職・年末調整なし',
    badge: '還付申告', badgeColor: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-200',
    desc: '年の途中で退職し年末調整を受けていない場合',
    headerBg: 'bg-rose-50', headerBorder: 'border-rose-200',
    steps: [
      { title: '源泉徴収票を受け取る',       body: '退職時に会社から源泉徴収票をもらいます。転職先がある場合は転職先に提出し、転職先で年末調整を受けます。' },
      { title: '還付申告の期間を確認する',   body: '還付申告は、翌年1月1日から5年間できます。義務ではありませんが、払いすぎた税金が戻ります。' },
      { title: '確定申告書を作成する',       body: '源泉徴収票の内容を入力します。社会保険料控除（国民年金・国保を自分で払った分）や生命保険料控除なども忘れずに入力しましょう。' },
      { title: '還付金を受け取る',           body: 'e-Taxなら3週間ほど、書面なら1〜2か月ほどで口座に振り込まれます。' },
    ],
    notes: [
      '退職後に転職した場合、前職の源泉徴収票を転職先に提出すれば転職先で年末調整を受けられます。',
      '年内に再就職しなかった場合は、自分で還付申告をすると税金が戻ることがあります。',
      '失業手当（基本手当）は非課税のため、申告に含めません。',
    ],
    docs: ['源泉徴収票（退職した会社分）', '社会保険料の控除証明書（国民年金等）', 'マイナンバーカード', '銀行口座情報'],
  },
  {
    id: 'deduction',
    emoji: Icons.check, label: '控除で還付申告する',
    badge: '各種控除', badgeColor: 'text-sky-700', badgeBg: 'bg-sky-50 border-sky-200',
    desc: '医療費・社会保険料・生命保険料などの控除がある場合',
    headerBg: 'bg-sky-50', headerBorder: 'border-sky-200',
    steps: [
      { title: '適用できる控除を確認する',   body: '以下の控除が申告漏れになっていないか確認しましょう。①社会保険料控除（国民年金・国保を自分で払った分）②医療費控除（年10万円、または所得の5%を超えた分）③生命保険料控除（自分で加入）④寄付金控除（ふるさと納税等）⑤障害者控除' },
      { title: '必要書類を集める',           body: '各控除の証明書類を集めます。社会保険料は控除証明書、医療費は領収書、生命保険は控除証明書、ふるさと納税は寄附金受領証明書が必要です。' },
      { title: '確定申告書を作成する',       body: 'e-Taxで申告書を作成し、各控除の金額を入力します。源泉徴収票の内容と合わせて入力します。' },
      { title: '還付金を受け取る',           body: 'e-Taxなら3週間ほど、書面なら1〜2か月ほどで振り込まれます。還付申告は翌年1月1日から5年間できます。' },
    ],
    notes: [
      '医療費控除は、家族の分も合わせた医療費（通院の交通費を含む）から保険などで戻った額を引き、10万円（所得が200万円未満なら所得の5%）を超えた分です。',
      '学生納付特例で猶予された国民年金を後から納めた場合は、納めた年の控除になります。',
      'ふるさと納税は、確定申告かワンストップ特例のどちらかで手続きします。確定申告をする場合、ワンストップ特例は使えなくなります。',
    ],
    docs: ['源泉徴収票', '各控除の証明書（社会保険料・生命保険料等）', '医療費の領収書（医療費控除の場合）', '寄附金受領証明書（ふるさと納税の場合）', 'マイナンバーカード', '銀行口座情報'],
  },
]



// ── ガイド一覧 ───────────────────────────────────────────
function GuideList({ onSelect, onNavigate }: {
  onSelect: (id: string) => void
  onNavigate: (s: string) => void
}) {
  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden min-h-screen bg-gray-100 flex flex-col">
        <div className="bg-slate-800 px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
              {Icons.back}
            </button>
            <div>
              <h1 className="text-white text-lg font-bold">ケース別ガイド</h1>
              <p className="text-slate-400 text-xs">あなたの状況に合った手順を確認</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 py-4 pb-24">
          <p className="text-gray-500 text-xs leading-relaxed mb-4">
            収入の種類に応じた確定申告の手順を解説しています。あてはまるケースを選んでください。
          </p>
          <div className="flex flex-col gap-3">
            {GUIDES.map((g) => (
              <button key={g.id} onClick={() => onSelect(g.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${g.headerBg} ${g.headerBorder} text-left w-full transition-all active:scale-95`}>
                <span className="w-11 h-11 rounded-xl bg-white text-navy-900 grid place-items-center flex-shrink-0">{g.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-800 text-sm font-bold">{g.label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${g.badgeColor} ${g.badgeBg}`}>{g.badge}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{g.desc}</p>
                </div>
                <span className="text-gray-400 flex-shrink-0">{Icons.arrow}</span>
              </button>
            ))}
          </div>
        </div>
        <BottomNav active="guide" onNavigate={onNavigate} />
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex h-screen bg-gray-100">
        <Sidebar active="guide" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex items-center gap-4 px-8 py-5 bg-slate-800 border-b border-slate-700">
            <div>
              <h2 className="text-white text-xl font-bold">ケース別ガイド</h2>
              <p className="text-slate-400 text-sm mt-0.5">あなたの状況に合った手順を確認</p>
            </div>
          </div>
          <div className="flex-1 p-8">
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              収入の種類に応じた確定申告の手順を解説しています。あてはまるケースを選んでください。
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-4xl">
              {GUIDES.map((g) => (
                <button key={g.id} onClick={() => onSelect(g.id)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border ${g.headerBg} ${g.headerBorder} text-left w-full transition-all hover:opacity-80`}>
                  <span className="w-11 h-11 rounded-xl bg-white text-navy-900 grid place-items-center flex-shrink-0">{g.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-gray-800 text-sm font-bold">{g.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${g.badgeColor} ${g.badgeBg}`}>{g.badge}</span>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">{g.desc}</p>
                  </div>
                  <span className="text-gray-400 flex-shrink-0">{Icons.arrow}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="py-6">
            <p className="text-gray-400 text-xs text-center">
              ※ 本アプリの情報は参考情報です。最終的な判断は税務署または税理士にご相談ください。
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ── ガイド詳細 ───────────────────────────────────────────
function GuideDetail({ guide, onBack, onNavigate }: {
  guide: Guide
  onBack: () => void
  onNavigate: (s: string) => void
}) {
  const [openStep, setOpenStep] = useState<number | null>(0)

  return (
    <>
      {/* ══ モバイル表示 ══ */}
      <div className="md:hidden min-h-screen bg-gray-100 flex flex-col">

        {/* ヘッダー */}
        <div className="bg-slate-800 px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700 border border-slate-600 text-slate-400 flex-shrink-0">
              {Icons.back}
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="w-11 h-11 rounded-xl bg-navy-800 text-white grid place-items-center flex-shrink-0">{guide.emoji}</span>
              <div className="min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${guide.badgeColor} ${guide.badgeBg} inline-block mb-0.5`}>
                  {guide.badge}
                </span>
                <h1 className="text-white text-base font-bold truncate">{guide.label}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 pb-24">

          {/* 申告手順 */}
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">申告の手順</p>
          <div className="flex flex-col gap-2 mb-6">
            {guide.steps.map((step, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => setOpenStep(openStep === i ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-gray-800 text-sm font-semibold flex-1">{step.title}</p>
                  <span className={`text-gray-400 transition-transform ${openStep === i ? 'rotate-180' : ''}`}>
                    {Icons.chevron}
                  </span>
                </button>
                {openStep === i && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed pt-3">{step.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 注意事項 */}
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">注意事項</p>
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-6">
            <div className="flex flex-col gap-2">
              {guide.notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sky-500 flex-shrink-0 mt-0.5">・</span>
                  <p className="text-sky-700 text-xs leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 必要書類 */}
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">必要書類</p>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col gap-2">
              {guide.docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-500 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{doc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={() => onNavigate('diagnose')}
            className="w-full py-3.5 rounded-2xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white mb-3">
            診断フローをやり直す
          </button>
          <button onClick={() => onNavigate('check')}
            className="w-full py-3.5 rounded-2xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            書類チェックリストへ
          </button>

          <p className="text-gray-400 text-xs text-center leading-relaxed mt-4 pb-2">
            ※ 本アプリの情報は参考情報です。<br />最終的な判断は税務署または税理士にご相談ください。
          </p>
        </div>
        <BottomNav active="guide" onNavigate={onNavigate} />
      </div>

      {/* ══ デスクトップ表示 ══ */}
      <div className="hidden md:flex h-screen bg-gray-100">
        <Sidebar active="guide" onNavigate={onNavigate} />
        <div className="flex-1 flex flex-col overflow-auto">

          {/* ヘッダー */}
          <div className="bg-slate-800 border-b border-slate-700 px-8 py-6 flex-shrink-0">
            <button onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors">
              {Icons.back}
              <span>ガイド一覧に戻る</span>
            </button>
            <div className="flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-navy-800 text-white grid place-items-center flex-shrink-0">{guide.emoji}</span>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${guide.badgeColor} ${guide.badgeBg} inline-block mb-2`}>
                  {guide.badge}
                </span>
                <h2 className="text-white text-2xl font-bold">{guide.label}</h2>
                <p className="text-slate-400 text-sm mt-1">{guide.desc}</p>
              </div>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-5xl grid grid-cols-5 gap-8">

              {/* 左：手順（3/5） */}
              <div className="col-span-3 flex flex-col gap-6">

                {/* 申告手順 */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">申告の手順</p>
                  <div className="flex flex-col gap-3">
                    {guide.steps.map((step, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <button onClick={() => setOpenStep(openStep === i ? null : i)}
                          className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-gray-800 text-sm font-semibold flex-1">{step.title}</p>
                          <span className={`text-gray-400 transition-transform ${openStep === i ? 'rotate-180' : ''}`}>
                            {Icons.chevron}
                          </span>
                        </button>
                        {openStep === i && (
                          <div className="px-5 pb-5 border-t border-gray-100">
                            <p className="text-gray-600 text-sm leading-relaxed pt-4">{step.body}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 注意事項 */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">注意事項</p>
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
                    <div className="flex flex-col gap-3">
                      {guide.notes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-sky-500 flex-shrink-0 mt-0.5">・</span>
                          <p className="text-sky-700 text-sm leading-relaxed">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 右：必要書類・CTA（2/5） */}
              <div className="col-span-2 flex flex-col gap-4">

                {/* 必要書類 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">必要書類</p>
                  <div className="flex flex-col gap-2.5">
                    {guide.docs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-500 text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{doc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">次のステップ</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => onNavigate('check')}
                      className="w-full py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                      書類チェックリストへ
                    </button>
                    <button onClick={() => onNavigate('diagnose')}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      診断フローをやり直す
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

// ── メインコンポーネント ─────────────────────────────────
export default function GuideScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedGuide = GUIDES.find((g) => g.id === selectedId)

  if (selectedGuide) {
    return (
      <GuideDetail
        guide={selectedGuide}
        onBack={() => setSelectedId(null)}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <GuideList
      onSelect={(id) => {
        trackEvent(AnalyticsEvents.guideCaseViewed, { case_id: id })
        setSelectedId(id)
      }}
      onNavigate={onNavigate}
    />
  )
}