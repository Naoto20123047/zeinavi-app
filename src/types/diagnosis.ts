// 診断の回答（その年ごとに変わる情報）
// 金額はすべて円。未入力は 0 として扱い、未回答の選択肢は '' で表す

export type YesNoUnknown = 'yes' | 'no' | 'unknown'

export type IncomeKind =
  | 'salary'      // 給料
  | 'freelance'   // 業務委託・フリーランスの報酬
  | 'sales'       // 作った物・仕入れた物の販売
  | 'usedGoods'   // 自分が使っていた物をフリマで売った
  | 'reward'      // アンケート謝礼・ポイ活
  | 'prize'       // 懸賞・キャンペーンの賞金
  | 'crypto'      // 暗号資産
  | 'stocks'      // 株・投資信託・FX
  | 'pension'     // 公的年金
  | 'retirement'  // 退職金
  | 'realEstate'  // 家賃収入など
  | 'nonTaxable'  // 奨学金・仕送り・お年玉・失業手当
  | 'other'       // 上のどれにも当てはまらない

export type PaidKind =
  | 'nationalPension'
  | 'nationalHealth'
  | 'medical'
  | 'donation'
  | 'lifeInsurance'
  | 'earthquake'
  | 'ideco'
  | 'housingLoan'

export type JobCount = '1' | '2' | '3+'
export type JobTiming = 'concurrent' | 'sequential' | 'both'
export type YearEndStatus = 'done' | 'notDone' | 'quit' | 'unknown'
export type StockMethod = 'nisa' | 'withholding' | 'other'
export type Disability = 'none' | 'self' | 'selfSpecial' | 'family' | 'familySpecial' | 'skip'

export interface Employer {
  id:              string
  name:            string
  salary:          number // 支払金額（通勤手当を除く）
  withheld:        number // 源泉徴収税額
  socialInsurance: number // 社会保険料等の金額
  submittedForm:   YesNoUnknown | '' // 扶養控除等申告書を出したか（甲欄か）
  yearEnd:         YearEndStatus | ''
}

export interface FamilyMember {
  id:             string
  relation:       'child' | 'parent' | 'other'
  birthYear:      number | null
  salary:         number
  otherIncome:    number
  livingTogether: boolean
}

export interface DiagnosisAnswers {
  version: 2

  // A. 確認
  profileConfirmed: boolean
  livedAbroad:      YesNoUnknown | ''

  // B. 受け取ったお金
  incomeKinds: IncomeKind[]
  noIncome:    boolean

  // C. 給料
  jobCount:          JobCount | ''
  jobTiming:         JobTiming | ''
  prevSlipSubmitted: YesNoUnknown | ''
  employers:         Employer[]
  workerStudentClaimed: YesNoUnknown | ''

  // D. 給料以外
  freelanceRevenue:   number
  freelanceExpense:   number
  freelanceWithheld:  number
  freelanceBookkeeping: YesNoUnknown | ''
  salesRevenue:       number
  salesCost:          number
  soldValuable:       YesNoUnknown | ''
  rewardAmount:       number
  prizeAmount:        number
  cryptoProfit:       number
  stockMethod:        StockMethod | ''
  pensionAmount:      number
  pensionWithheld:    YesNoUnknown | ''
  otherNote:          string

  // E. 自分で払ったお金
  paidKinds:          PaidKind[]
  noPaid:             boolean
  nationalPension:    number
  nationalHealth:     number
  medicalPaid:        number
  medicalReimbursed:  number
  donationAmount:     number
  oneStop:            YesNoUnknown | ''
  lifeGeneral:        number
  lifeMedicalCare:    number
  lifePension:        number
  earthquake:         number
  ideco:              number
  housingLoanFirstYear: YesNoUnknown | ''
  disability:         Disability | ''

  // F. 学校
  schoolCertified:    YesNoUnknown | ''

  // G. 養っている家族
  spouseSalary:       number
  spouseOtherIncome:  number
  spouseBirthYear:    number | null
  family:             FamilyMember[]
}

export function newEmployer(index: number): Employer {
  return {
    id: `emp-${index}-${Date.now()}`,
    name: '',
    salary: 0,
    withheld: 0,
    socialInsurance: 0,
    submittedForm: '',
    yearEnd: '',
  }
}

export function newFamilyMember(index: number): FamilyMember {
  return {
    id: `fam-${index}-${Date.now()}`,
    relation: 'child',
    birthYear: null,
    salary: 0,
    otherIncome: 0,
    livingTogether: true,
  }
}

export const EMPTY_ANSWERS: DiagnosisAnswers = {
  version: 2,
  profileConfirmed: false,
  livedAbroad: '',
  incomeKinds: [],
  noIncome: false,
  jobCount: '',
  jobTiming: '',
  prevSlipSubmitted: '',
  employers: [],
  workerStudentClaimed: '',
  freelanceRevenue: 0,
  freelanceExpense: 0,
  freelanceWithheld: 0,
  freelanceBookkeeping: '',
  salesRevenue: 0,
  salesCost: 0,
  soldValuable: '',
  rewardAmount: 0,
  prizeAmount: 0,
  cryptoProfit: 0,
  stockMethod: '',
  pensionAmount: 0,
  pensionWithheld: '',
  otherNote: '',
  paidKinds: [],
  noPaid: false,
  nationalPension: 0,
  nationalHealth: 0,
  medicalPaid: 0,
  medicalReimbursed: 0,
  donationAmount: 0,
  oneStop: '',
  lifeGeneral: 0,
  lifeMedicalCare: 0,
  lifePension: 0,
  earthquake: 0,
  ideco: 0,
  housingLoanFirstYear: '',
  disability: '',
  schoolCertified: '',
  spouseSalary: 0,
  spouseOtherIncome: 0,
  spouseBirthYear: null,
  family: [],
}

// ── 判定結果 ─────────────────────────────────────────────
export type OutcomeStatus = 'mustFile' | 'refund' | 'noNeed' | 'outOfScope'

export interface Line {
  label: string
  value: number
}

export interface OutcomeNote {
  kind:  'residentTax' | 'dependent' | 'insurance' | 'workerStudent' | 'oneStop' | 'housingLoan' | 'nonTaxable' | 'check'
  tone:  'info' | 'warn'
  title: string
  body:  string
}

export interface DiagnosisOutcome {
  status:            OutcomeStatus
  obligation:        boolean
  /** 還付の見込み額（所得税） */
  refundAmount:      number
  /** 納める見込み額（所得税） */
  paymentAmount:     number
  /** 還付があるが金額を試算しないケース（住宅ローン控除の1年目など） */
  refundUnknown:     boolean
  estimatedTax:      number
  withheldTotal:     number
  totalIncome:       number
  taxableIncome:     number
  incomeLines:       Line[]
  deductionLines:    Line[]
  /** 申告が必要／不要の理由（画面の「判定の根拠」に出す文） */
  reasons:           string[]
  notes:             OutcomeNote[]
  /** 「わからない」などで確認が必要な項目 */
  pending:           string[]
  outOfScopeReasons: string[]
}
