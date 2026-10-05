// 診断の質問の並びと、出す条件・回答済みかの判定
import type { Profile } from '../../types/profile'
import type { DiagnosisAnswers, IncomeKind, PaidKind } from '../../types/diagnosis'

export type StepId =
  | 'confirm'
  | 'abroad'
  | 'incomeKinds'
  | 'jobCount'
  | 'jobTiming'
  | 'prevSlip'
  | 'employers'
  | 'workerStudentClaimed'
  | 'freelance'
  | 'sales'
  | 'usedGoods'
  | 'reward'
  | 'prize'
  | 'crypto'
  | 'stocks'
  | 'pension'
  | 'other'
  | 'paidKinds'
  | 'paidDetails'
  | 'disability'
  | 'school'
  | 'spouse'
  | 'family'

export const STEP_GROUP: Record<StepId, string> = {
  confirm:              'はじめの確認',
  abroad:               'はじめの確認',
  incomeKinds:          '受け取ったお金',
  jobCount:             '給料',
  jobTiming:            '給料',
  prevSlip:             '給料',
  employers:            '給料',
  workerStudentClaimed: '給料',
  freelance:            '給料以外のお金',
  sales:                '給料以外のお金',
  usedGoods:            '給料以外のお金',
  reward:               '給料以外のお金',
  prize:                '給料以外のお金',
  crypto:               '給料以外のお金',
  stocks:               '給料以外のお金',
  pension:              '給料以外のお金',
  other:                '給料以外のお金',
  paidKinds:            '自分で払ったお金',
  paidDetails:          '自分で払ったお金',
  disability:           '自分で払ったお金',
  school:               '学校の確認',
  spouse:               '養っている家族',
  family:               '養っている家族',
}

export const INCOME_OPTIONS: { value: IncomeKind; label: string; sub?: string }[] = [
  { value: 'salary',     label: '給料', sub: '会社員・パート・アルバイト' },
  { value: 'freelance',  label: '業務委託・フリーランスの報酬', sub: '家庭教師の個人契約、単発のイベント業務、デザイン・動画編集・ライターなど、雇用契約でない仕事' },
  { value: 'sales',      label: '作った物・仕入れた物の販売', sub: 'ハンドメイド作品、転売など' },
  { value: 'usedGoods',  label: '自分が使っていた物をフリマで売った' },
  { value: 'reward',     label: 'アンケート謝礼・ポイ活' },
  { value: 'prize',      label: '懸賞やキャンペーンの賞金・賞品' },
  { value: 'crypto',     label: '暗号資産（仮想通貨）の売却や交換' },
  { value: 'stocks',     label: '株・投資信託・FX' },
  { value: 'pension',    label: '公的年金' },
  { value: 'retirement', label: '退職金' },
  { value: 'realEstate', label: '家賃収入など不動産のお金' },
  { value: 'nonTaxable', label: '奨学金・仕送り・お年玉・失業手当' },
  { value: 'other',      label: '上のどれにも当てはまらないお金' },
]

export const PAID_OPTIONS: { value: PaidKind; label: string; sub?: string }[] = [
  { value: 'nationalPension', label: '国民年金保険料', sub: '学生納付特例で猶予中の期間は払っていない扱いです' },
  { value: 'nationalHealth',  label: '国民健康保険料' },
  { value: 'medical',         label: '医療費', sub: '自分や同じ家計の家族の分' },
  { value: 'donation',        label: 'ふるさと納税・寄付' },
  { value: 'lifeInsurance',   label: '生命保険料', sub: '自分が契約者のもの' },
  { value: 'earthquake',      label: '地震保険料' },
  { value: 'ideco',           label: 'iDeCoの掛金' },
  { value: 'housingLoan',     label: '住宅ローン' },
]

const hasIncome = (a: DiagnosisAnswers, k: IncomeKind) => !a.noIncome && a.incomeKinds.includes(k)

/** 今の回答とプロフィールから、出す質問を順番に並べる */
export function visibleSteps(p: Profile, a: DiagnosisAnswers): StepId[] {
  const s: StepId[] = ['confirm', 'abroad', 'incomeKinds']
  if (hasIncome(a, 'salary')) {
    s.push('jobCount')
    if (a.jobCount === '2' || a.jobCount === '3+') s.push('jobTiming')
    if (a.jobTiming === 'sequential' || a.jobTiming === 'both') s.push('prevSlip')
    s.push('employers')
    if (p.role === 'student' && a.employers.some((e) => e.yearEnd === 'done')) s.push('workerStudentClaimed')
  }
  if (hasIncome(a, 'freelance'))  s.push('freelance')
  if (hasIncome(a, 'sales'))      s.push('sales')
  if (hasIncome(a, 'usedGoods'))  s.push('usedGoods')
  if (hasIncome(a, 'reward'))     s.push('reward')
  if (hasIncome(a, 'prize'))      s.push('prize')
  if (hasIncome(a, 'crypto'))     s.push('crypto')
  if (hasIncome(a, 'stocks'))     s.push('stocks')
  if (hasIncome(a, 'pension'))    s.push('pension')
  if (hasIncome(a, 'other'))      s.push('other')
  s.push('paidKinds')
  if (!a.noPaid && a.paidKinds.length > 0) s.push('paidDetails')
  s.push('disability')
  if (p.role === 'student' && (p.schoolType === 'vocational' || p.schoolType === 'otherSchool')) s.push('school')
  if (p.supports.includes('spouse')) s.push('spouse')
  if (p.supports.includes('child') || p.supports.includes('parent')) s.push('family')
  return s
}

/** その質問に答え終わったか（「次へ」を押せるか） */
export function isStepAnswered(id: StepId, a: DiagnosisAnswers): boolean {
  switch (id) {
    case 'confirm':     return a.profileConfirmed
    case 'abroad':      return a.livedAbroad !== ''
    case 'incomeKinds': return a.noIncome || a.incomeKinds.length > 0
    case 'jobCount':    return a.jobCount !== ''
    case 'jobTiming':   return a.jobTiming !== ''
    case 'prevSlip':    return a.prevSlipSubmitted !== ''
    case 'employers':
      return a.employers.length > 0 && a.employers.every(
        (e) => e.salary > 0 && e.submittedForm !== '' && (e.submittedForm !== 'yes' || e.yearEnd !== ''),
      )
    case 'workerStudentClaimed': return a.workerStudentClaimed !== ''
    case 'freelance':   return a.freelanceRevenue > 0 && a.freelanceBookkeeping !== ''
    case 'sales':       return a.salesRevenue > 0
    case 'usedGoods':   return a.soldValuable !== ''
    case 'reward':      return a.rewardAmount > 0
    case 'prize':       return a.prizeAmount > 0
    case 'crypto':      return true // 損失なら0円で進める
    case 'stocks':      return a.stockMethod !== ''
    case 'pension':     return a.pensionAmount > 0 && a.pensionWithheld !== ''
    case 'other':       return a.otherNote.trim() !== ''
    case 'paidKinds':   return a.noPaid || a.paidKinds.length > 0
    case 'paidDetails':
      return (!a.paidKinds.includes('donation') || a.oneStop !== '') &&
        (!a.paidKinds.includes('housingLoan') || a.housingLoanFirstYear !== '')
    case 'disability':  return a.disability !== ''
    case 'school':      return true
    case 'spouse':      return a.spouseBirthYear !== null
    case 'family':      return a.family.every((m) => m.birthYear !== null)
  }
}
