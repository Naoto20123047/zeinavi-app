import {
  DEDUCTION_AMOUNTS,
  calcBasicDeduction,
  calcSalaryDeduction,
  calcIncomeTax,
  calcLifeInsuranceDeduction,
} from '../config/taxConfig'

export interface EstimateInput {
  salaryIncome:    number
  withheldTax:     number
  sideIncome:      number
  sideExpense:     number
  socialInsurance: number
  lifeInsurance:   number
  medicalExpense:  number
  donation:        number
  isWorkerStudent: boolean
  isDisabled:      boolean
}

export interface EstimateResult {
  type:           'refund' | 'payment' | 'none'
  amount:         number
  taxableIncome:  number
  calculatedTax:  number
  totalDeduction: number
  breakdown:      { label: string; value: number }[]
}

export function estimateTax(input: EstimateInput): EstimateResult {
  const {
    salaryIncome, withheldTax, sideIncome, sideExpense,
    socialInsurance, lifeInsurance, medicalExpense, donation,
    isWorkerStudent, isDisabled,
  } = input

  const D = DEDUCTION_AMOUNTS

  // ① 給与所得 = 給与収入 − 給与所得控除
  const salaryIncomeNet = Math.max(salaryIncome - calcSalaryDeduction(salaryIncome), 0)

  // ② 事業所得 = 収入 − 経費
  const sideIncomeNet = Math.max(sideIncome - sideExpense, 0)

  // ③ 合計所得（基礎控除の判定に使う）
  const totalIncome = salaryIncomeNet + sideIncomeNet

  // ④ 所得控除を集計
  const breakdown: { label: string; value: number }[] = []

  // 基礎控除は合計所得に応じて段階的に決まる
  const basicDeduction = calcBasicDeduction(totalIncome)
  breakdown.push({ label: '基礎控除', value: basicDeduction })

  const socialDeduction = Math.max(socialInsurance, 0)
  if (socialDeduction > 0) breakdown.push({ label: '社会保険料控除', value: socialDeduction })

  const lifeDeduction = calcLifeInsuranceDeduction(lifeInsurance)
  if (lifeDeduction > 0) breakdown.push({ label: '生命保険料控除', value: lifeDeduction })

  let medicalDeduction = 0
  if (medicalExpense > D.medicalThreshold) {
    medicalDeduction = medicalExpense - D.medicalThreshold
    breakdown.push({ label: '医療費控除', value: medicalDeduction })
  }

  let donationDeduction = 0
  if (donation > D.donationSelfPay) {
    donationDeduction = donation - D.donationSelfPay
    breakdown.push({ label: '寄付金控除', value: donationDeduction })
  }

  let workerStudentDeduction = 0
  if (isWorkerStudent) {
    workerStudentDeduction = D.workerStudent
    breakdown.push({ label: '勤労学生控除', value: workerStudentDeduction })
  }

  let disabledDeduction = 0
  if (isDisabled) {
    disabledDeduction = D.disabled
    breakdown.push({ label: '障害者控除', value: disabledDeduction })
  }

  const totalDeduction =
    basicDeduction + socialDeduction + lifeDeduction + medicalDeduction +
    donationDeduction + workerStudentDeduction + disabledDeduction

  // ⑤ 課税所得 = 合計所得 − 控除合計
  const taxableIncome = Math.max(totalIncome - totalDeduction, 0)

  // ⑥ 本来の所得税
  const calculatedTax = calcIncomeTax(taxableIncome)

  // ⑦ 源泉徴収済み − 本来の税額 → プラスなら還付、マイナスなら追加納税
  const diff = withheldTax - calculatedTax

  let type: 'refund' | 'payment' | 'none' = 'none'
  let amount = 0
  if (diff > 0)      { type = 'refund';  amount = diff }
  else if (diff < 0) { type = 'payment'; amount = Math.abs(diff) }

  return {
    type,
    amount,
    taxableIncome,
    calculatedTax,
    totalDeduction,
    breakdown,
  }
}