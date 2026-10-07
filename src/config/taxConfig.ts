// ═══════════════════════════════════════════════════════
//  税制データ設定ファイル（2026年／令和8年分）
//  税制改正時はこのファイルの数値を更新してください
//  出典：国税庁「令和8年4月 源泉所得税の改正のあらまし」
//        国税庁「令和8年度税制改正による所得税の基礎控除の引上げ等について」
//        令和8年度税制改正大綱
//  ※ 基礎控除の特例（104万円）と給与所得控除の特例（74万円）は令和8・9年分の時限措置
// ═══════════════════════════════════════════════════════

export const TAX_YEAR = 2026

// ── 年収の壁（給与収入ベースの目安） ──────────────────────
export const INCOME_WALLS = {
  /** 住民税（所得割）がかかり始める目安。自治体の級地により前後する（1級地：45万円＋74万円） */
  residentTax:            1190000,
  /** 親などの扶養控除の対象外になる（合計所得62万円＋給与所得控除74万円） */
  dependentTax:           1360000,
  /** 健康保険の扶養の上限（一般） */
  dependentInsurance:     1300000,
  /** 健康保険の扶養の上限（19歳以上23歳未満、配偶者を除く） */
  dependentInsurance1922: 1500000,
  /** 勤労学生控除を受けられる上限（合計所得89万円＋74万円） */
  workerStudent:          1630000,
  /** 給与収入だけの人の所得税がかかり始める（基礎控除104万円＋給与所得控除74万円） */
  incomeTax:              1780000,
  /** 特定親族特別控除の対象の上限（合計所得123万円＋74万円） */
  specificRelativeMax:    1970000,
}

// ── 申告が必要かどうかの基準額 ────────────────────────────
export const FILING_RULES = {
  /** 給与以外の所得がこの額以下なら、給与所得者は申告不要（所得税法121条） */
  sideIncomeExemption:   200000,
  /** 2か所以上から給与：給与収入から一定の控除を引いた額がこの額以下なら申告不要 */
  multiJobSmallSalary:   1500000,
  /** 給与収入がこの額を超えると年末調整の対象外で申告が必要 */
  salaryFilingRequired:  20000000,
  /** 公的年金の確定申告不要制度：年金収入の上限 */
  pensionExemption:      4000000,
}

// ── 基礎控除（2026・2027年の特例措置込み・合計所得に応じて段階変動） ──
// 合計所得489万円以下は104万円（本則62万＋特例42万）
export const BASIC_DEDUCTION_TABLE = [
  { incomeLimit: 4890000,  amount: 1040000 }, // 489万円以下：104万円（特例）
  { incomeLimit: 6550000,  amount: 670000 },  // 489万円超〜655万円以下：67万円（本則62万＋特例5万）
  { incomeLimit: 23500000, amount: 620000 },  // 655万円超〜2350万円以下：62万円
  { incomeLimit: 24000000, amount: 480000 },  // 2350万円超〜2400万円以下：48万円
  { incomeLimit: 24500000, amount: 320000 },  // 2400万円超〜2450万円以下：32万円
  { incomeLimit: 25000000, amount: 160000 },  // 2450万円超〜2500万円以下：16万円
  { incomeLimit: Infinity, amount: 0 },        // 2500万円超：0円
]

// ── 所得控除の金額 ─────────────────────────────────────────
export const DEDUCTION_AMOUNTS = {
  salaryMinimum:        740000, // 給与所得控除の最低保障額（本則69万＋特例5万。給与収入220万円以下）
  workerStudent:        270000, // 勤労学生控除
  disabled:             270000, // 障害者控除（一般）
  disabledSpecial:      400000, // 障害者控除（特別障害者）
  disabledSpecialLiving: 750000, // 障害者控除（同居特別障害者・扶養親族のみ）
  lifeInsurancePerType:  40000, // 生命保険料控除（新制度）の区分ごとの上限
  lifeInsuranceTotal:   120000, // 生命保険料控除の合計の上限
  earthquakeMax:         50000, // 地震保険料控除の上限
  medicalThreshold:     100000, // 医療費控除の足切り額（総所得金額等の5%が低ければそちら）
  medicalRate:            0.05,
  medicalMax:          2000000, // 医療費控除の上限
  donationSelfPay:        2000, // 寄付金控除の自己負担額
  donationIncomeRate:      0.4, // 寄付金控除の対象は総所得金額等の40%まで
  occasionalSpecial:    500000, // 一時所得の特別控除
}

// ── 勤労学生・扶養などの所得要件（令和8年分） ────────────────
export const INCOME_REQUIREMENTS = {
  dependent:               620000, // 扶養親族・同一生計配偶者の合計所得の上限
  workerStudent:           890000, // 勤労学生の合計所得の上限
  workerStudentNonLabor:   100000, // 勤労学生の「勤労によらない所得」の上限
  specificRelativeMax:    1230000, // 特定親族特別控除の対象となる合計所得の上限
  spouseSpecialMax:       1330000, // 配偶者特別控除の対象となる配偶者の合計所得の上限
  spouseTaxpayerMax:     10000000, // 配偶者控除を受ける本人の合計所得の上限
  residentTaxNonTaxable:   450000, // 住民税（所得割）非課税の目安（1級地・扶養なし）
  residentTaxWorkerStudent: 1350000, // 勤労学生などの住民税非課税の合計所得の上限
}

// ── 扶養控除の金額 ─────────────────────────────────────────
export const DEPENDENT_DEDUCTION = {
  general:     380000, // 一般（16歳以上）
  specific:    630000, // 特定扶養（19歳以上23歳未満）
  elderly:     480000, // 老人扶養（70歳以上）
  elderlyLiving: 580000, // 同居老親等
}

// ── 特定親族特別控除（19歳以上23歳未満の親族・合計所得62万円超123万円以下） ──
// ※ 下限は令和8年分から62万円。上の区分は令和7年度改正の表による（改正時は要確認）
export const SPECIFIC_RELATIVE_TABLE = [
  { incomeLimit:  850000, amount: 630000 },
  { incomeLimit:  900000, amount: 610000 },
  { incomeLimit:  950000, amount: 510000 },
  { incomeLimit: 1000000, amount: 410000 },
  { incomeLimit: 1050000, amount: 310000 },
  { incomeLimit: 1100000, amount: 210000 },
  { incomeLimit: 1150000, amount: 110000 },
  { incomeLimit: 1200000, amount:  60000 },
  { incomeLimit: 1230000, amount:  30000 },
]

// ── 配偶者控除・配偶者特別控除（本人の合計所得で3段階） ─────────
// 本人の合計所得：900万円以下／950万円以下／1000万円以下
export const SPOUSE_DEDUCTION = {
  general: [380000, 260000, 130000],
  elderly: [480000, 320000, 160000], // 配偶者が70歳以上
}
// 配偶者の合計所得の区分ごと（下限は令和8年分から62万円。上の区分は改正時に要確認）
export const SPOUSE_SPECIAL_TABLE = [
  { incomeLimit:  950000, amounts: [380000, 260000, 130000] },
  { incomeLimit: 1000000, amounts: [360000, 240000, 120000] },
  { incomeLimit: 1050000, amounts: [310000, 210000, 110000] },
  { incomeLimit: 1100000, amounts: [260000, 180000,  90000] },
  { incomeLimit: 1150000, amounts: [210000, 140000,  70000] },
  { incomeLimit: 1200000, amounts: [160000, 110000,  60000] },
  { incomeLimit: 1250000, amounts: [110000,  80000,  40000] },
  { incomeLimit: 1300000, amounts: [ 60000,  40000,  20000] },
  { incomeLimit: 1330000, amounts: [ 30000,  20000,  10000] },
]

// ── 復興特別所得税率（所得税に2.1%上乗せ） ──────────────
export const RECONSTRUCTION_TAX_RATE = 1.021

// ═══════════════════════════════════════════════════════
//  計算式（税率・控除の計算方法が変わったときのみ変更）
// ═══════════════════════════════════════════════════════

// 基礎控除：合計所得金額に応じて段階的に決まる
export function calcBasicDeduction(totalIncome: number): number {
  for (const row of BASIC_DEDUCTION_TABLE) {
    if (totalIncome <= row.incomeLimit) return row.amount
  }
  return 0
}

// 給与所得控除：給与収入から差し引ける金額（令和8年分）
// ※ 220万円以下は特例の最低保障74万円（30%＋8万円が74万円に達するのが220万円）
// ※ 660万円未満は所得税法別表第五により収入金額を4,000円単位に切り捨てて計算する
export function calcSalaryDeduction(salaryIncome: number): number {
  if (salaryIncome <= 0) return 0
  if (salaryIncome <= 2200000) return Math.min(DEDUCTION_AMOUNTS.salaryMinimum, salaryIncome)
  const base = salaryIncome < 6600000 ? Math.floor(salaryIncome / 4000) * 4000 : salaryIncome
  if (salaryIncome <= 3600000) return Math.floor(base * 0.3 + 80000)
  if (salaryIncome <= 6600000) return Math.floor(base * 0.2 + 440000)
  if (salaryIncome <= 8500000) return Math.floor(salaryIncome * 0.1 + 1100000)
  return 1950000
}

/** 給与所得（給与収入 − 給与所得控除、0円未満にはしない） */
export function calcSalaryIncome(salaryIncome: number): number {
  return Math.max(salaryIncome - calcSalaryDeduction(salaryIncome), 0)
}

// 所得税：課税所得に応じた累進課税（復興特別所得税込み）
// 国税庁ルール：課税所得は1000円未満切捨 → 税率適用 → 復興税2.1%加算 → 100円未満切捨
export function calcIncomeTax(taxableIncome: number): number {
  const taxable = Math.floor(Math.max(taxableIncome, 0) / 1000) * 1000

  let baseTax: number
  if (taxable <= 1950000)       baseTax = taxable * 0.05
  else if (taxable <= 3300000)  baseTax = taxable * 0.10 - 97500
  else if (taxable <= 6950000)  baseTax = taxable * 0.20 - 427500
  else if (taxable <= 9000000)  baseTax = taxable * 0.23 - 636000
  else if (taxable <= 18000000) baseTax = taxable * 0.33 - 1536000
  else if (taxable <= 40000000) baseTax = taxable * 0.40 - 2796000
  else                          baseTax = taxable * 0.45 - 4796000

  const withReconstruction = Math.floor(baseTax) * RECONSTRUCTION_TAX_RATE
  return Math.floor(withReconstruction / 100) * 100
}

// 生命保険料控除：区分ごとの支払額に応じた控除額（新制度）
export function calcLifeInsuranceDeductionPerType(paid: number): number {
  if (paid <= 0)      return 0
  if (paid <= 20000)  return paid
  if (paid <= 40000)  return Math.floor(paid / 2 + 10000)
  if (paid <= 80000)  return Math.floor(paid / 4 + 20000)
  return DEDUCTION_AMOUNTS.lifeInsurancePerType
}

/** 一般・介護医療・個人年金の3区分の合計（上限12万円） */
export function calcLifeInsuranceDeduction(general: number, medicalCare = 0, pension = 0): number {
  const sum =
    calcLifeInsuranceDeductionPerType(general) +
    calcLifeInsuranceDeductionPerType(medicalCare) +
    calcLifeInsuranceDeductionPerType(pension)
  return Math.min(sum, DEDUCTION_AMOUNTS.lifeInsuranceTotal)
}

/** 地震保険料控除（支払額全額、上限5万円） */
export function calcEarthquakeDeduction(paid: number): number {
  return Math.min(Math.max(paid, 0), DEDUCTION_AMOUNTS.earthquakeMax)
}

/** 医療費控除：10万円と総所得金額等の5%の低い方を超えた分（上限200万円） */
export function calcMedicalDeduction(netPaid: number, totalIncome: number): number {
  const threshold = Math.min(
    DEDUCTION_AMOUNTS.medicalThreshold,
    Math.floor(Math.max(totalIncome, 0) * DEDUCTION_AMOUNTS.medicalRate),
  )
  return Math.min(Math.max(netPaid - threshold, 0), DEDUCTION_AMOUNTS.medicalMax)
}

/** 寄付金控除：総所得金額等の40%までの寄付額 − 2,000円 */
export function calcDonationDeduction(donation: number, totalIncome: number): number {
  const target = Math.min(donation, Math.floor(Math.max(totalIncome, 0) * DEDUCTION_AMOUNTS.donationIncomeRate))
  return Math.max(target - DEDUCTION_AMOUNTS.donationSelfPay, 0)
}

/** 特定親族特別控除（親などが受ける額） */
export function calcSpecificRelativeDeduction(relativeIncome: number): number {
  if (relativeIncome <= INCOME_REQUIREMENTS.dependent) return 0
  for (const row of SPECIFIC_RELATIVE_TABLE) {
    if (relativeIncome <= row.incomeLimit) return row.amount
  }
  return 0
}

/** 本人の合計所得から、配偶者控除の表の列（0〜2）を決める。対象外は -1 */
function spouseColumn(taxpayerIncome: number): number {
  if (taxpayerIncome <= 9000000)  return 0
  if (taxpayerIncome <= 9500000)  return 1
  if (taxpayerIncome <= 10000000) return 2
  return -1
}

/** 配偶者控除・配偶者特別控除 */
export function calcSpouseDeduction(
  taxpayerIncome: number,
  spouseIncome: number,
  spouseAge: number,
): { label: string; amount: number } | null {
  const col = spouseColumn(taxpayerIncome)
  if (col < 0) return null
  if (spouseIncome <= INCOME_REQUIREMENTS.dependent) {
    const table = spouseAge >= 70 ? SPOUSE_DEDUCTION.elderly : SPOUSE_DEDUCTION.general
    return { label: '配偶者控除', amount: table[col] }
  }
  for (const row of SPOUSE_SPECIAL_TABLE) {
    if (spouseIncome <= row.incomeLimit) return { label: '配偶者特別控除', amount: row.amounts[col] }
  }
  return null
}

/** 扶養控除（16歳以上・合計所得62万円以下の親族） */
export function calcDependentDeduction(age: number, income: number, livingTogether: boolean): number {
  if (age < 16 || income > INCOME_REQUIREMENTS.dependent) return 0
  if (age >= 19 && age <= 22) return DEPENDENT_DEDUCTION.specific
  if (age >= 70) return livingTogether ? DEPENDENT_DEDUCTION.elderlyLiving : DEPENDENT_DEDUCTION.elderly
  return DEPENDENT_DEDUCTION.general
}

// ═══════════════════════════════════════════════════════
//  表示用フォーマッタ／ラベル
//  画面側に「178万円」などを直書きせず、必ずここを経由させる
// ═══════════════════════════════════════════════════════

/** 1780000 → "178万円" */
export function formatMan(yen: number): string {
  const man = yen / 10000
  return `${Number.isInteger(man) ? man : man.toFixed(1)}万円`
}

/** 1280000 → "1,280,000円" */
export function formatYen(yen: number): string {
  return `${Math.round(yen).toLocaleString('ja-JP')}円`
}

export const WALL_LABELS = {
  incomeTax:              formatMan(INCOME_WALLS.incomeTax),              // 178万円
  residentTax:            formatMan(INCOME_WALLS.residentTax),            // 119万円
  dependentTax:           formatMan(INCOME_WALLS.dependentTax),           // 136万円
  dependentInsurance:     formatMan(INCOME_WALLS.dependentInsurance),     // 130万円
  dependentInsurance1922: formatMan(INCOME_WALLS.dependentInsurance1922), // 150万円
  workerStudent:          formatMan(INCOME_WALLS.workerStudent),          // 163万円
  sideIncome:             formatMan(FILING_RULES.sideIncomeExemption),    // 20万円
} as const

/** ホーム画面の年収メーターの右端 */
export const INCOME_BAR_LIMIT = 2000000

export const FILING_DEADLINE_LABEL = '3月15日'

/** 申告期限（翌年3月15日） */
export const FILING_DEADLINE_DATE = new Date(TAX_YEAR + 1, 2, 15)

/** 還付申告ができる最終日（5年後の12月31日） */
export const REFUND_LAST_DATE_LABEL = `${TAX_YEAR + 5}年12月31日`

/** AIチャットの1日あたり利用上限。Firestore ルール側の上限とも揃えること */
export const CHAT_DAILY_LIMIT = 10

/** 例: "2027年3月15日" */
export const FILING_DEADLINE_FULL_LABEL = `${TAX_YEAR + 1}年${FILING_DEADLINE_LABEL}`
