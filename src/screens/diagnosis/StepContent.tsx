// 診断の質問1つ分の表示（見出し・説明・選択肢）
import type { ReactNode } from 'react'
import type { RecordSummary } from '../../utils/recordsToAnswers'
import {
  RadioChoice,
  CheckChoice,
  YesNoUnknownChoices,
  YenField,
  HelpBox,
} from '../../components/ui'
import { TAX_YEAR } from '../../config/taxConfig'
import {
  ROLE_LABELS,
  SCHOOL_LABELS,
  ENROLLMENT_LABELS,
  DEPENDENT_OF_LABELS,
  SUPPORTED_LABELS,
  INSURANCE_LABELS,
  type Profile,
} from '../../types/profile'
import {
  newEmployer,
  newFamilyMember,
  type DiagnosisAnswers,
  type Employer,
  type FamilyMember,
  type JobCount,
  type YearEndStatus,
  type Disability,
  type StockMethod,
  type JobTiming,
} from '../../types/diagnosis'
import { INCOME_OPTIONS, PAID_OPTIONS, type StepId } from './steps'

type Update = (patch: Partial<DiagnosisAnswers>) => void

const BIRTH_YEARS = Array.from({ length: 100 }, (_, i) => TAX_YEAR - i)

function Question({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-[22px] md:text-[26px] font-black leading-snug m-0">{title}</h2>
        {lead && <p className="text-sm text-muted leading-relaxed m-0">{lead}</p>}
      </div>
      {children}
    </div>
  )
}

/** 記録から下書きを入れたことを知らせる */
function RecordNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-brand-200 bg-brand-50 px-4 py-3 text-[13px] leading-relaxed text-ink">
      <span className="font-bold text-brand-600 mr-2">記録から入れました</span>
      {children}
    </div>
  )
}

const yen = (n: number) => `${n.toLocaleString()}円`

function BirthYearSelect({ id, label, value, onChange }: {
  id: string; label: string; value: number | null; onChange: (v: number | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      <select
        id={id}
        className="field"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">選んでください</option>
        {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
      </select>
    </div>
  )
}

function SubCard({ title, children, onRemove }: { title: string; children: ReactNode; onRemove?: () => void }) {
  return (
    <div className="card p-4 md:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-navy-900">{title}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-muted underline">削除する</button>
        )}
      </div>
      {children}
    </div>
  )
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

// ── 給料の勤務先 ─────────────────────────────────────────
const YEAR_END_OPTIONS: { value: YearEndStatus; label: string; sub?: string }[] = [
  { value: 'done',    label: '年末調整を受けた', sub: '12月まで働いていて、勤務先で手続きをした' },
  { value: 'notDone', label: '12月まで働いたが、受けていない' },
  { value: 'quit',    label: '年の途中でやめた' },
  { value: 'unknown', label: 'わからない' },
]

function EmployerCard({ index, e, canRemove, onChange, onRemove }: {
  index: number; e: Employer; canRemove: boolean
  onChange: (patch: Partial<Employer>) => void; onRemove: () => void
}) {
  return (
    <SubCard title={e.name ? e.name : `${index + 1}か所目の勤務先`} onRemove={canRemove ? onRemove : undefined}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`emp-name-${e.id}`} className="text-sm font-bold">勤務先の名前（なくてもかまいません）</label>
        <input
          id={`emp-name-${e.id}`}
          className="field"
          value={e.name}
          placeholder="例：駅前のカフェ"
          onChange={(ev) => onChange({ name: ev.target.value })}
        />
      </div>
      <YenField
        id={`emp-salary-${e.id}`}
        label="1年間の給料"
        sub="源泉徴収票の「支払金額」です。ない場合は、給与明細の総支給額（通勤手当を除く）を1年分足してください。"
        value={e.salary}
        onChange={(v) => onChange({ salary: v })}
      />
      <YenField
        id={`emp-withheld-${e.id}`}
        label="引かれた所得税"
        sub="源泉徴収票の「源泉徴収税額」、または給与明細の「所得税」の1年分です。0円のときは空欄のままで大丈夫です。"
        value={e.withheld}
        onChange={(v) => onChange({ withheld: v })}
      />
      <YenField
        id={`emp-social-${e.id}`}
        label="引かれた社会保険料"
        sub="源泉徴収票の「社会保険料等の金額」です。健康保険・厚生年金・雇用保険の合計で、引かれていなければ空欄です。"
        value={e.socialInsurance}
        onChange={(v) => onChange({ socialInsurance: v })}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">この勤務先に「扶養控除等申告書」を出しましたか</span>
        <YesNoUnknownChoices
          value={e.submittedForm}
          onChange={(v) => onChange({ submittedForm: v, yearEnd: v === 'yes' ? e.yearEnd : '' })}
          yesSub="働き始めるときに、名前や家族を書いて出す用紙です"
        />
      </div>
      {e.submittedForm === 'yes' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">この勤務先での年末調整</span>
          {YEAR_END_OPTIONS.map((o) => (
            <RadioChoice
              key={o.value}
              label={o.label}
              sub={o.sub}
              muted={o.value === 'unknown'}
              selected={e.yearEnd === o.value}
              onClick={() => onChange({ yearEnd: o.value })}
            />
          ))}
        </div>
      )}
    </SubCard>
  )
}

// ── 養っている家族 ───────────────────────────────────────
function FamilyCard({ index, m, onChange, onRemove }: {
  index: number; m: FamilyMember; onChange: (patch: Partial<FamilyMember>) => void; onRemove: () => void
}) {
  return (
    <SubCard title={`${index + 1}人目`} onRemove={onRemove}>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">続柄</span>
        <div className="grid grid-cols-3 gap-2">
          {([['child', '子ども'], ['parent', '親・祖父母'], ['other', 'その他の親族']] as const).map(([v, l]) => (
            <RadioChoice key={v} label={l} selected={m.relation === v} onClick={() => onChange({ relation: v })} />
          ))}
        </div>
      </div>
      <BirthYearSelect id={`fam-birth-${m.id}`} label="生まれた年" value={m.birthYear} onChange={(v) => onChange({ birthYear: v })} />
      <YenField id={`fam-salary-${m.id}`} label="その人の1年間の給料" sub="アルバイト代などです。なければ空欄です。" value={m.salary} onChange={(v) => onChange({ salary: v })} />
      <YenField id={`fam-other-${m.id}`} label="給料以外の所得" sub="年金などがある場合だけ入れてください。" value={m.otherIncome} onChange={(v) => onChange({ otherIncome: v })} />
      {m.relation === 'parent' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">一緒に住んでいますか</span>
          <div className="grid grid-cols-2 gap-2">
            <RadioChoice label="一緒に住んでいる" selected={m.livingTogether} onClick={() => onChange({ livingTogether: true })} />
            <RadioChoice label="別に住んでいる" selected={!m.livingTogether} onClick={() => onChange({ livingTogether: false })} />
          </div>
        </div>
      )}
    </SubCard>
  )
}

// ── 本体 ────────────────────────────────────────────────
export default function StepContent({ id, profile, answers: a, update, records = null, onEditProfile }: {
  id: StepId
  profile: Profile
  answers: DiagnosisAnswers
  update: Update
  /** 記録を使って始めたときだけ渡される */
  records?: RecordSummary | null
  onEditProfile: () => void
}) {
  const setEmployer = (i: number, patch: Partial<Employer>) =>
    update({ employers: a.employers.map((e, j) => (j === i ? { ...e, ...patch } : e)) })
  const setMember = (i: number, patch: Partial<FamilyMember>) =>
    update({ family: a.family.map((m, j) => (j === i ? { ...m, ...patch } : m)) })

  switch (id) {
    case 'confirm': {
      const rows: [string, string][] = [
        ['あなたについて', profile.role ? ROLE_LABELS[profile.role] : '未登録'],
        ['生まれた年', profile.birthYear ? `${profile.birthYear}年` : '未登録'],
      ]
      if (profile.role === 'student') {
        rows.push(['学校', profile.schoolType ? SCHOOL_LABELS[profile.schoolType] : '未登録'])
        rows.push(['在籍', profile.enrollment ? ENROLLMENT_LABELS[profile.enrollment] : '未登録'])
      }
      rows.push(['扶養', profile.dependentOf ? DEPENDENT_OF_LABELS[profile.dependentOf] : '未登録'])
      rows.push(['養っている家族', profile.supports.length ? profile.supports.map((s) => SUPPORTED_LABELS[s]).join('・') : 'いない'])
      rows.push(['保険証', profile.insurance ? INSURANCE_LABELS[profile.insurance] : '未登録'])
      return (
        <Question
          title="登録している情報で合っていますか"
          lead={`${TAX_YEAR}年12月31日時点の状況で判定します。年の途中で変わった場合は、12月31日時点に合わせてください。`}
        >
          <dl className="card divide-y divide-sand-200 m-0">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className={`text-sm font-bold text-right m-0 ${v === '未登録' ? 'text-warn-700' : ''}`}>{v}</dd>
              </div>
            ))}
          </dl>
          {!profile.role && (
            <p className="text-[13px] text-warn-700 leading-relaxed m-0">
              プロフィールが未登録のため、学生向けの控除などは判定に入りません。先に登録すると正確になります。
            </p>
          )}
          <div className="flex flex-col gap-2">
            <RadioChoice
              label="この内容で合っています"
              selected={a.profileConfirmed}
              onClick={() => update({ profileConfirmed: !a.profileConfirmed })}
            />
            <button type="button" className="btn-secondary" onClick={onEditProfile}>プロフィールを変更する</button>
          </div>
        </Question>
      )
    }

    case 'abroad':
      return (
        <Question
          title={`${TAX_YEAR}年に、海外に住んでいた期間はありますか`}
          lead="留学や海外勤務などで、1年以上の予定で海外に住んでいた期間がある場合は「はい」です。旅行や短期の留学は含みません。"
        >
          <YesNoUnknownChoices value={a.livedAbroad} onChange={(v) => update({ livedAbroad: v })} />
        </Question>
      )

    case 'prepaid':
      return (
        <Question
          title={`${TAX_YEAR}年の所得税の一部を、「予定納税」で先に納めましたか`}
          lead="前の年の所得税が15万円以上だった人には、税務署から7月と11月に納める通知が届きます。通知が届いていなければ「いいえ」です。"
        >
          <YesNoUnknownChoices value={a.prepaidTax ?? ''} onChange={(v) => update({ prepaidTax: v })} />
        </Question>
      )

    case 'incomeKinds':
      return (
        <Question
          title={`${TAX_YEAR}年に受け取ったお金をすべて選んでください`}
          lead="1月から12月までに受け取ったものです。少額でも選んでください。税金がかからないものも、ここで選んでおくと判定から外せます。"
        >
          {records && (records.partTime.count + records.freelance.count + records.flea.count + records.other.count > 0) && (
            <RecordNote>
              {records.partTime.count + records.freelance.count > 0 && '記録にあるアルバイト・業務委託を選んでおきました。'}
              {records.flea.count > 0 && `フリマの記録（${yen(records.flea.total)}）があります。自分が使っていた物なら「自分が使っていた物をフリマで売った」、作った物・仕入れた物なら「作った物・仕入れた物の販売」を選んでください。`}
              {records.other.count > 0 && `その他の収入の記録（${yen(records.other.total)}）があります。当てはまるものを選んでください。`}
            </RecordNote>
          )}
          <div className="flex flex-col gap-2">
            {INCOME_OPTIONS.map((o) => (
              <CheckChoice
                key={o.value}
                label={o.label}
                sub={o.sub}
                checked={!a.noIncome && a.incomeKinds.includes(o.value)}
                onClick={() => update({ noIncome: false, incomeKinds: toggle(a.incomeKinds, o.value) })}
              />
            ))}
            <CheckChoice
              label="どれも受け取っていない"
              checked={a.noIncome}
              onClick={() => update({ noIncome: !a.noIncome, incomeKinds: [] })}
            />
          </div>
        </Question>
      )

    case 'jobCount':
      return (
        <Question
          title="給料をもらった勤務先はいくつですか"
          lead="年の途中でやめた勤務先や、短期・単発のアルバイトも1か所として数えてください。"
        >
          {records && records.partTime.count > 0 && (
            <RecordNote>記録の振り込み元の数（{records.partTime.sources.length}か所）から選んでおきました。同じ勤務先が別の名前で記録されていないか確認してください。</RecordNote>
          )}
          <div className="flex flex-col gap-2">
            {([['1', '1か所'], ['2', '2か所'], ['3+', '3か所以上']] as [JobCount, string][]).map(([v, l]) => (
              <RadioChoice
                key={v}
                label={l}
                selected={a.jobCount === v}
                onClick={() => {
                  const want = v === '1' ? 1 : v === '2' ? 2 : Math.max(3, a.employers.length)
                  const employers = a.employers.slice(0, want)
                  while (employers.length < want) employers.push(newEmployer(employers.length))
                  update({
                    jobCount: v,
                    employers,
                    jobTiming: v === '1' ? '' : a.jobTiming,
                    prevSlipSubmitted: v === '1' ? '' : a.prevSlipSubmitted,
                  })
                }}
              />
            ))}
          </div>
        </Question>
      )

    case 'jobTiming':
      return (
        <Question title="勤務先で働いた時期は重なっていますか">
          <div className="flex flex-col gap-2">
            {([
              ['concurrent', '同じ時期に掛け持ちしていた'],
              ['sequential', '1か所をやめてから、次で働き始めた', '転職やアルバイトの切り替えなど'],
              ['both',       '掛け持ちも、切り替えもあった'],
            ] as [JobTiming, string, string?][]).map(([v, l, sub]) => (
              <RadioChoice
                key={v}
                label={l}
                sub={sub}
                selected={a.jobTiming === v}
                onClick={() => update({ jobTiming: v, prevSlipSubmitted: v === 'concurrent' ? '' : a.prevSlipSubmitted })}
              />
            ))}
          </div>
        </Question>
      )

    case 'prevSlip':
      return (
        <Question
          title="前の勤務先の源泉徴収票を、次の勤務先に出しましたか"
          lead="出していれば、次の勤務先の年末調整で前の給料もまとめて計算されています。"
        >
          <YesNoUnknownChoices value={a.prevSlipSubmitted} onChange={(v) => update({ prevSlipSubmitted: v })} />
        </Question>
      )

    case 'employers':
      return (
        <Question
          title="勤務先ごとに、給料と引かれた金額を入れてください"
          lead="源泉徴収票があれば、その数字をそのまま写してください。1月以降に勤務先からもらえます。"
        >
          {records && records.partTime.count > 0 && (
            <RecordNote>振り込み元ごとの合計を「1年間の給料」に入れました。記録は振り込まれた額（手取り）なので、源泉徴収票の「支払金額」より少なくなります。源泉徴収票があれば、そちらの数字に直してください。</RecordNote>
          )}
          <div className="flex flex-col gap-3">
            {a.employers.map((e, i) => (
              <EmployerCard
                key={e.id}
                index={i}
                e={e}
                canRemove={a.jobCount === '3+' && a.employers.length > 3}
                onChange={(patch) => setEmployer(i, patch)}
                onRemove={() => update({ employers: a.employers.filter((_, j) => j !== i) })}
              />
            ))}
            {a.jobCount === '3+' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => update({ employers: [...a.employers, newEmployer(a.employers.length)] })}
              >
                勤務先を追加する
              </button>
            )}
          </div>
          <HelpBox title="源泉徴収票が手元にないとき">
            やめた勤務先にも発行してもらえます（会社には交付の義務があります）。確定申告をするときは源泉徴収票の数字が必要になるため、早めに依頼しておくと安心です。
          </HelpBox>
        </Question>
      )

    case 'workerStudentClaimed':
      return (
        <Question
          title="年末調整のときに「勤労学生」の欄に記入しましたか"
          lead="扶養控除等申告書や年末調整の書類に「勤労学生」のチェック欄があります。"
        >
          <YesNoUnknownChoices value={a.workerStudentClaimed} onChange={(v) => update({ workerStudentClaimed: v })} />
        </Question>
      )

    case 'freelance':
      return (
        <Question title="業務委託・フリーランスの報酬について教えてください" lead="1年分の合計です。">
          {records && records.freelance.count > 0 && (
            <RecordNote>
              業務委託の記録の合計（{yen(records.freelance.total)}）を報酬に、経費の記録の合計（{yen(records.expense.total)}）を経費に入れました。報酬から税金が引かれている場合、記録は引かれた後の額なので、支払調書の「支払金額」に直してください。経費には、この仕事に関係ないものを含めないでください。
            </RecordNote>
          )}
          <YenField id="fl-rev" label="受け取った報酬の合計" sub="引かれた税金を足す前の額（支払調書の「支払金額」）です。" value={a.freelanceRevenue} onChange={(v) => update({ freelanceRevenue: v })} />
          <YenField id="fl-exp" label="仕事のために使ったお金（経費）" sub="交通費・材料費・ソフト代など、その仕事のために使った分です。" value={a.freelanceExpense} onChange={(v) => update({ freelanceExpense: v })} />
          <YenField id="fl-wh" label="報酬から引かれた税金" sub="支払調書の「源泉徴収税額」です。引かれていなければ空欄です。" value={a.freelanceWithheld} onChange={(v) => update({ freelanceWithheld: v })} />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">開業届を出して、事業として帳簿を付けていますか</span>
            <YesNoUnknownChoices
              value={a.freelanceBookkeeping}
              onChange={(v) => update({ freelanceBookkeeping: v })}
              noSub="副業やお小遣い程度の仕事なら、多くは「いいえ」です"
            />
          </div>
        </Question>
      )

    case 'sales':
      return (
        <Question title="作った物・仕入れた物の販売について教えてください" lead="1年分の合計です。">
          <YenField id="sl-rev" label="売れた金額の合計" sub="手数料や送料を引く前の額です。" value={a.salesRevenue} onChange={(v) => update({ salesRevenue: v })} />
          <YenField id="sl-cost" label="材料費・仕入れ・手数料・送料などの合計" value={a.salesCost} onChange={(v) => update({ salesCost: v })} />
        </Question>
      )

    case 'usedGoods':
      return (
        <Question
          title="1つ30万円を超える物を売りましたか"
          lead="自分が使っていた服や家具などを売ったお金には税金がかかりません。ただし、貴金属・宝石・美術品などで1つ30万円を超えるものは別です。"
        >
          <YesNoUnknownChoices value={a.soldValuable} onChange={(v) => update({ soldValuable: v })} />
        </Question>
      )

    case 'reward':
      return (
        <Question title="アンケート謝礼・ポイ活で受け取った額" lead="現金のほか、換金できるポイントも含みます。買い物でもらえるポイントは含みません。">
          <YenField id="rw" label="1年間の合計" value={a.rewardAmount} onChange={(v) => update({ rewardAmount: v })} />
        </Question>
      )

    case 'prize':
      return (
        <Question title="懸賞やキャンペーンで受け取った額" lead="賞品は、もらった物のお店での値段で数えます。宝くじの当せん金は含みません。">
          <YenField id="pz" label="1年間の合計" value={a.prizeAmount} onChange={(v) => update({ prizeAmount: v })} />
        </Question>
      )

    case 'crypto':
      return (
        <Question
          title="暗号資産の利益を入れてください"
          lead="売った額や、別の暗号資産・商品と交換したときの価値から、買ったときの額を引いた1年分の利益です。損をした場合は空欄のままにしてください。"
        >
          <YenField id="cr" label="1年間の利益" value={a.cryptoProfit} onChange={(v) => update({ cryptoProfit: v })} />
          <HelpBox title="利益の調べ方">
            取引所の「年間取引報告書」に損益の目安が載っています。複数の取引所を使っている場合は合計してください。
          </HelpBox>
        </Question>
      )

    case 'stocks':
      return (
        <Question title="株・投資信託・FXの取引は、どの方法でしましたか" lead="複数ある場合は、いちばん下に近いものを選んでください。">
          <div className="flex flex-col gap-2">
            {([
              ['nisa',        'NISAの口座だけ', '利益に税金はかかりません'],
              ['withholding', '「源泉徴収あり」の特定口座', '税金が引かれているため、申告しなくてかまいません'],
              ['other',       '一般口座・源泉徴収なしの口座・FX'],
            ] as [StockMethod, string, string?][]).map(([v, l, sub]) => (
              <RadioChoice key={v} label={l} sub={sub} selected={a.stockMethod === v} onClick={() => update({ stockMethod: v })} />
            ))}
          </div>
          {a.stockMethod !== '' && a.stockMethod !== 'other' && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">前の年までの株・投資信託の損失を、確定申告で繰り越していますか</span>
              <YesNoUnknownChoices
                value={a.carryoverLoss ?? ''}
                onChange={(v) => update({ carryoverLoss: v })}
                yesSub="去年までの確定申告で「損失の繰越」をした場合です。繰り越した損失を使うには、今年も申告が必要です"
              />
            </div>
          )}
        </Question>
      )

    case 'pension':
      return (
        <Question title="公的年金について教えてください">
          <YenField id="pn" label="1年間に受け取った公的年金の額" sub="「公的年金等の源泉徴収票」の支払金額です。" value={a.pensionAmount} onChange={(v) => update({ pensionAmount: v })} />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">年金はすべて、税金が引かれた状態で受け取っていますか</span>
            <YesNoUnknownChoices value={a.pensionWithheld} onChange={(v) => update({ pensionWithheld: v })} />
          </div>
        </Question>
      )

    case 'other':
      return (
        <Question title="どんなお金か、簡単に書いてください" lead="このアプリでは判定できないため、相談先をご案内します。書いた内容は判定の記録にだけ使います。">
          <textarea
            className="field min-h-28"
            value={a.otherNote}
            placeholder="例：知人から仕事を頼まれて受け取ったお金"
            onChange={(e) => update({ otherNote: e.target.value })}
          />
        </Question>
      )

    case 'paidKinds':
      return (
        <Question
          title={`${TAX_YEAR}年に自分で払ったお金を選んでください`}
          lead="年末調整で勤務先に出した保険料（生命保険料・地震保険料・国民年金など）も含めて選んでください。給料から引かれた社会保険料は、さきほど入れたので含めません。"
        >
          <div className="flex flex-col gap-2">
            {PAID_OPTIONS.map((o) => (
              <CheckChoice
                key={o.value}
                label={o.label}
                sub={o.sub}
                checked={!a.noPaid && a.paidKinds.includes(o.value)}
                onClick={() => update({ noPaid: false, paidKinds: toggle(a.paidKinds, o.value) })}
              />
            ))}
            <CheckChoice
              label="どれも払っていない"
              checked={a.noPaid}
              onClick={() => update({ noPaid: !a.noPaid, paidKinds: [] })}
            />
          </div>
        </Question>
      )

    case 'paidDetails': {
      const k = a.paidKinds
      return (
        <Question title="払った金額を入れてください" lead="1月から12月までに払った額です。証明書やはがきの金額を写してください。">
          {k.includes('nationalPension') && (
            <SubCard title="国民年金保険料">
              <YenField id="pd-np" label="払った額" sub="日本年金機構から届く「控除証明書」の金額です。家族の分を払った場合も含められます。" value={a.nationalPension} onChange={(v) => update({ nationalPension: v })} />
            </SubCard>
          )}
          {k.includes('nationalHealth') && (
            <SubCard title="国民健康保険料">
              <YenField id="pd-nh" label="払った額" sub="市区町村から届く納付額の通知、または領収書の合計です。" value={a.nationalHealth} onChange={(v) => update({ nationalHealth: v })} />
            </SubCard>
          )}
          {k.includes('medical') && (
            <SubCard title="医療費">
              <YenField id="pd-md" label="払った医療費の合計" sub="病院・薬局・通院の交通費などです。同じ家計の家族の分も合わせられます。" value={a.medicalPaid} onChange={(v) => update({ medicalPaid: v })} />
              <YenField id="pd-mr" label="保険などで戻ってきた額" sub="医療保険の給付金や高額療養費などです。なければ空欄です。" value={a.medicalReimbursed} onChange={(v) => update({ medicalReimbursed: v })} />
            </SubCard>
          )}
          {k.includes('donation') && (
            <SubCard title="ふるさと納税・寄付">
              <YenField id="pd-dn" label="寄付した額の合計" value={a.donationAmount} onChange={(v) => update({ donationAmount: v })} />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">ワンストップ特例の申請書を出しましたか</span>
                <YesNoUnknownChoices value={a.oneStop} onChange={(v) => update({ oneStop: v })} />
              </div>
            </SubCard>
          )}
          {k.includes('lifeInsurance') && (
            <SubCard title="生命保険料">
              <p className="text-xs text-muted leading-relaxed m-0">保険会社から届く「控除証明書」の、年間の金額を区分ごとに入れてください。</p>
              <YenField id="pd-lg" label="一般生命保険料" value={a.lifeGeneral} onChange={(v) => update({ lifeGeneral: v })} />
              <YenField id="pd-lm" label="介護医療保険料" value={a.lifeMedicalCare} onChange={(v) => update({ lifeMedicalCare: v })} />
              <YenField id="pd-lp" label="個人年金保険料" value={a.lifePension} onChange={(v) => update({ lifePension: v })} />
            </SubCard>
          )}
          {k.includes('earthquake') && (
            <SubCard title="地震保険料">
              <YenField id="pd-eq" label="払った額" sub="控除証明書の金額です。火災保険だけの分は含みません。" value={a.earthquake} onChange={(v) => update({ earthquake: v })} />
            </SubCard>
          )}
          {k.includes('ideco') && (
            <SubCard title="iDeCoの掛金">
              <YenField id="pd-id" label="自分で払った掛金" sub="給料から引かれている場合は、年末調整で済んでいることが多いです。" value={a.ideco} onChange={(v) => update({ ideco: v })} />
            </SubCard>
          )}
          {k.includes('housingLoan') && (
            <SubCard title="住宅ローン">
              <span className="text-sm font-bold">{TAX_YEAR}年に住み始めましたか（控除を受けるのが1年目ですか）</span>
              <YesNoUnknownChoices value={a.housingLoanFirstYear} onChange={(v) => update({ housingLoanFirstYear: v })} noSub="2年目以降は、勤務先の年末調整で受けられます" />
            </SubCard>
          )}
        </Question>
      )
    }

    case 'disability':
      return (
        <Question
          title="あなたや養っている家族に、障害者手帳などを持っている人はいますか"
          lead="障害者控除の判定に使います。答えたくない場合は「答えない」を選べます（その場合は控除を入れずに計算します）。"
        >
          <div className="flex flex-col gap-2">
            {([
              ['none',          'いない'],
              ['self',          '本人が持っている'],
              ['selfSpecial',   '本人が持っている（1級・2級など重度）'],
              ['family',        '養っている家族が持っている'],
              ['familySpecial', '養っている家族が持っている（1級・2級など重度）'],
              ['skip',          '答えない'],
            ] as [Disability, string][]).map(([v, l]) => (
              <RadioChoice key={v} label={l} muted={v === 'skip'} selected={a.disability === v} onClick={() => update({ disability: v })} />
            ))}
          </div>
        </Question>
      )

    case 'school':
      return (
        <Question
          title="通っている学校の課程は、勤労学生控除の対象ですか"
          lead="専門学校などは、一定の条件を満たす課程だけが対象です。対象の場合は、学校から証明書をもらえます。"
        >
          <YesNoUnknownChoices
            value={a.schoolCertified}
            onChange={(v) => update({ schoolCertified: v })}
            yes="対象です（証明書をもらえる）"
            no="対象ではありません"
          />
          <HelpBox title="わからないとき">
            学校の事務室に「勤労学生控除の証明書は出ますか」と聞くと確認できます。わからないままでも、診断は続けられます。
          </HelpBox>
        </Question>
      )

    case 'spouse':
      return (
        <Question title="配偶者について教えてください" lead={`${TAX_YEAR}年12月31日時点の情報です。`}>
          <BirthYearSelect id="sp-birth" label="配偶者の生まれた年" value={a.spouseBirthYear} onChange={(v) => update({ spouseBirthYear: v })} />
          <YenField id="sp-salary" label="配偶者の1年間の給料" sub="パートなどの給料です。なければ空欄です。" value={a.spouseSalary} onChange={(v) => update({ spouseSalary: v })} />
          <YenField id="sp-other" label="配偶者の給料以外の所得" sub="年金や副業などがある場合だけ入れてください。" value={a.spouseOtherIncome} onChange={(v) => update({ spouseOtherIncome: v })} />
        </Question>
      )

    case 'family':
      return (
        <Question title="養っている家族について教えてください" lead="配偶者以外で、生活費を出している家族を1人ずつ入れてください。">
          <div className="flex flex-col gap-3">
            {a.family.map((m, i) => (
              <FamilyCard
                key={m.id}
                index={i}
                m={m}
                onChange={(patch) => setMember(i, patch)}
                onRemove={() => update({ family: a.family.filter((_, j) => j !== i) })}
              />
            ))}
            {a.family.length === 0 && (
              <p className="text-sm text-muted m-0">まだ入力していません。いない場合はそのまま次へ進んでください。</p>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const m = newFamilyMember(a.family.length)
                if (!profile.supports.includes('child') && profile.supports.includes('parent')) m.relation = 'parent'
                update({ family: [...a.family, m] })
              }}
            >
              家族を追加する
            </button>
          </div>
        </Question>
      )
  }
}
