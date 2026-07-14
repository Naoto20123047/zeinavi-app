// ═══════════════════════════════════════════════════════
//  税制データ設定ファイル（2026年度／令和8年分）
//  税制改正時はこのファイルの数値を更新してください
//  出典：国税庁「令和7年度税制改正による基礎控除の見直し等」
//        令和8年度税制改正大綱
//  ※ 178万円の壁は令和8・9年分の時限措置（特例）に基づく
// ═══════════════════════════════════════════════════════

export const TAX_YEAR = 2026

// ── 年収の壁（ホーム画面・診断画面に表示） ──────────────
export const INCOME_WALLS = {
  incomeTax:              1780000, // 所得税の壁（給与収入のみ・特例措置適用時の目安）
  residentTax:            1100000, // 住民税の壁（超えると課税）
  dependentInsurance:     1300000, // 社会保険の扶養上限（一般）
  dependentInsurance1922: 1500000, // 社会保険の扶養上限（19〜22歳）
}

// ── 基礎控除（2026・2027年の特例措置込み・合計所得に応じて段階変動） ──
// 出典：令和8年度税制改正大綱。合計所得489万円以下は104万円（本則62万＋特例42万）
export const BASIC_DEDUCTION_TABLE = [
  { incomeLimit: 4890000,  amount: 1040000 }, // 489万円以下：104万円（特例）
  { incomeLimit: 6550000,  amount: 670000 },  // 489万円超〜655万円以下：67万円
  { incomeLimit: 23500000, amount: 620000 },  // 655万円超〜2350万円以下：62万円
  { incomeLimit: 24000000, amount: 480000 },  // 2350万円超〜2400万円以下：48万円
  { incomeLimit: 24500000, amount: 320000 },  // 2400万円超〜2450万円以下：32万円
  { incomeLimit: 25000000, amount: 160000 },  // 2450万円超〜2500万円以下：16万円
  { incomeLimit: Infinity, amount: 0 },        // 2500万円超：0円
]

// ── その他の所得控除の金額 ──────────────────────────────
export const DEDUCTION_AMOUNTS = {
  salaryMinimum:      740000, // 給与所得控除の最低保障額（本則69万＋特例5万）
  workerStudent:      270000, // 勤労学生控除
  disabled:           270000, // 障害者控除（一般）
  lifeInsuranceMax:    40000, // 生命保険料控除の上限（新制度・一般）
  medicalThreshold:   100000, // 医療費控除の足切り額
  donationSelfPay:      2000, // 寄付金控除の自己負担額
}

// ── 申告が必要になる基準額 ──────────────────────────────
export const REPORT_THRESHOLDS = {
  sideIncome:          200000, // 副業・フリマ所得の申告ライン
  workerStudentIncome: 850000, // 勤労学生控除の合計所得上限
}

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

// 給与所得控除：給与収入から差し引ける金額（令和8年分・速算表）
// ※ 令和7年改正で162.5万・180万の区分は「190万円以下」に統合された
export function calcSalaryDeduction(salaryIncome: number): number {
  if (salaryIncome <= 0)       return 0
  if (salaryIncome <= 1900000) return 740000            // 最低保障74万円（特例込み）
  if (salaryIncome <= 3600000) return salaryIncome * 0.3 + 80000
  if (salaryIncome <= 6600000) return salaryIncome * 0.2 + 440000
  if (salaryIncome <= 8500000) return salaryIncome * 0.1 + 1100000
  return 1950000
}

// 所得税：課税所得に応じた累進課税（復興特別所得税込み）
// 国税庁ルール：課税所得は1000円未満切捨 → 税率適用 → 復興税2.1%加算 → 100円未満切捨
export function calcIncomeTax(taxableIncome: number): number {
  const taxable = Math.floor(taxableIncome / 1000) * 1000

  let baseTax = 0
  if (taxable <= 1950000)       baseTax = taxable * 0.05
  else if (taxable <= 3300000)  baseTax = taxable * 0.10 - 97500
  else if (taxable <= 6950000)  baseTax = taxable * 0.20 - 427500
  else if (taxable <= 9000000)  baseTax = taxable * 0.23 - 636000
  else if (taxable <= 18000000) baseTax = taxable * 0.33 - 1536000
  else if (taxable <= 40000000) baseTax = taxable * 0.40 - 2796000
  else                          baseTax = taxable * 0.45 - 4796000

  const withReconstruction = baseTax * RECONSTRUCTION_TAX_RATE
  return Math.floor(withReconstruction / 100) * 100
}

// 生命保険料控除：支払額に応じた控除額（新制度）
export function calcLifeInsuranceDeduction(paid: number): number {
  if (paid <= 0)      return 0
  if (paid <= 20000)  return paid
  if (paid <= 40000)  return Math.floor(paid / 2 + 10000)
  if (paid <= 80000)  return Math.floor(paid / 4 + 20000)
  return 40000
}