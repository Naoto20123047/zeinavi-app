// ═══════════════════════════════════════════════════════
//  確定申告の判定エンジン（画面から切り離した純関数）
//  入力：プロフィール＋その年の回答  出力：申告義務・見込み額・注意事項
//  ※ 税額の計算はすべてここで行い、画面側では計算しない
// ═══════════════════════════════════════════════════════
import {
  TAX_YEAR,
  FILING_RULES,
  INCOME_WALLS,
  INCOME_REQUIREMENTS,
  DEDUCTION_AMOUNTS,
  DEPENDENT_DEDUCTION,
  calcBasicDeduction,
  calcSalaryIncome,
  calcIncomeTax,
  calcLifeInsuranceDeduction,
  calcEarthquakeDeduction,
  calcMedicalDeduction,
  calcDonationDeduction,
  calcSpecificRelativeDeduction,
  calcSpouseDeduction,
  calcDependentDeduction,
  formatMan,
  formatYen,
  REFUND_LAST_DATE_LABEL,
} from '../config/taxConfig'
import type { Profile } from '../types/profile'
import type {
  DiagnosisAnswers,
  DiagnosisOutcome,
  Line,
  OutcomeNote,
} from '../types/diagnosis'

/** 12月31日時点の年齢 */
export function ageAtYearEnd(birthYear: number | null): number | null {
  if (!birthYear) return null
  return TAX_YEAR - birthYear
}

const has = (a: DiagnosisAnswers, k: DiagnosisAnswers['incomeKinds'][number]) =>
  !a.noIncome && a.incomeKinds.includes(k)

const paid = (a: DiagnosisAnswers, k: DiagnosisAnswers['paidKinds'][number]) =>
  !a.noPaid && a.paidKinds.includes(k)

const pos = (n: number) => Math.max(Number.isFinite(n) ? n : 0, 0)

// ── 所得の計算 ───────────────────────────────────────────
export interface IncomeSummary {
  salaryTotal:      number
  salaryIncome:     number
  /** 雑所得（業務：業務委託・販売） */
  miscBusiness:     number
  /** 雑所得（その他：謝礼・暗号資産） */
  miscOther:        number
  /** 一時所得（総所得金額に算入する1/2後の額） */
  occasionalHalf:   number
  /** 給与以外の所得の合計（20万円ルールの判定に使う） */
  nonSalaryIncome:  number
  /** 合計所得金額 */
  totalIncome:      number
  /** 勤労学生の「勤労によらない所得」 */
  nonLaborIncome:   number
  /** 健康保険の扶養判定に使う見込み収入（目安） */
  insuranceIncome:  number
}

export function summarizeIncome(a: DiagnosisAnswers): IncomeSummary {
  const salaryTotal = has(a, 'salary') ? a.employers.reduce((s, e) => s + pos(e.salary), 0) : 0
  const salaryIncome = calcSalaryIncome(salaryTotal)

  const freelanceNet = has(a, 'freelance') ? pos(a.freelanceRevenue) - pos(a.freelanceExpense) : 0
  const salesNet     = has(a, 'sales') ? pos(a.salesRevenue) - pos(a.salesCost) : 0
  const reward       = has(a, 'reward') ? pos(a.rewardAmount) : 0
  const crypto       = has(a, 'crypto') ? pos(a.cryptoProfit) : 0

  // 雑所得の中では赤字を差し引きできるが、他の所得とは通算できない
  const miscBusinessRaw = freelanceNet + salesNet
  const miscTotal = Math.max(miscBusinessRaw + reward + crypto, 0)
  const miscBusiness = Math.max(Math.min(miscBusinessRaw, miscTotal), 0)
  const miscOther = miscTotal - miscBusiness

  const prize = has(a, 'prize') ? pos(a.prizeAmount) : 0
  const occasional = Math.max(prize - DEDUCTION_AMOUNTS.occasionalSpecial, 0)
  const occasionalHalf = Math.floor(occasional / 2)

  const nonSalaryIncome = miscTotal + occasionalHalf
  const totalIncome = salaryIncome + nonSalaryIncome

  return {
    salaryTotal,
    salaryIncome,
    miscBusiness,
    miscOther,
    occasionalHalf,
    nonSalaryIncome,
    totalIncome,
    nonLaborIncome: miscOther + occasionalHalf,
    insuranceIncome: salaryTotal + Math.max(miscBusinessRaw, 0) + reward + crypto + prize,
  }
}

// ── 勤労学生控除 ──────────────────────────────────────────
type Eligibility = 'yes' | 'no' | 'pending'

export function workerStudentEligibility(p: Profile, a: DiagnosisAnswers, inc: IncomeSummary): Eligibility {
  if (p.role !== 'student') return 'no'
  const hasLaborIncome = inc.salaryIncome > 0 || inc.miscBusiness > 0 || inc.salaryTotal > 0
  if (!hasLaborIncome) return 'no'
  if (inc.totalIncome > INCOME_REQUIREMENTS.workerStudent) return 'no'
  if (inc.nonLaborIncome > INCOME_REQUIREMENTS.workerStudentNonLabor) return 'no'
  // 専修学校・各種学校は一定の課程だけが対象
  if (p.schoolType === 'vocational' || p.schoolType === 'otherSchool') {
    if (a.schoolCertified === 'yes') return p.enrollment === 'leave' ? 'pending' : 'yes'
    if (a.schoolCertified === 'no') return 'no'
    return 'pending'
  }
  if (!p.schoolType) return 'pending'
  return p.enrollment === 'leave' ? 'pending' : 'yes'
}

// ── 判定本体 ─────────────────────────────────────────────
export function diagnose(p: Profile, a: DiagnosisAnswers): DiagnosisOutcome {
  const inc = summarizeIncome(a)
  const age = ageAtYearEnd(p.birthYear)
  const notes: OutcomeNote[] = []
  const pending: string[] = []
  const reasons: string[] = []
  const outOfScopeReasons: string[] = []

  // ── 判定しないケース ──
  if (a.livedAbroad === 'yes') outOfScopeReasons.push('2026年の途中で海外に住んでいた期間がある')
  if (has(a, 'retirement')) outOfScopeReasons.push('退職金を受け取った')
  if (has(a, 'realEstate')) outOfScopeReasons.push('家賃収入など不動産のお金がある')
  if (has(a, 'other')) outOfScopeReasons.push('分類できないお金がある')
  if (has(a, 'usedGoods') && a.soldValuable === 'yes') outOfScopeReasons.push('1つ30万円を超える貴金属・美術品などを売った')
  if (has(a, 'stocks') && a.stockMethod === 'other') outOfScopeReasons.push('株・FXを一般口座・源泉徴収なしの口座・FXで取引した')
  if (has(a, 'freelance') && a.freelanceBookkeeping === 'yes') outOfScopeReasons.push('事業として帳簿を付けて申告している')
  if (inc.salaryTotal > FILING_RULES.salaryFilingRequired) {
    // 2,000万円超は申告が必要なことだけ判定し、金額は試算しない
  }

  // ── 公的年金（申告不要制度の判定だけ行う） ──
  if (has(a, 'pension')) {
    const otherIncome = inc.totalIncome
    const exempt =
      pos(a.pensionAmount) <= FILING_RULES.pensionExemption &&
      a.pensionWithheld === 'yes' &&
      otherIncome <= FILING_RULES.sideIncomeExemption
    if (a.pensionWithheld === 'unknown') pending.push('年金がすべて源泉徴収されているか')
    if (exempt) reasons.push(`公的年金が${formatMan(FILING_RULES.pensionExemption)}以下で、ほかの所得が${formatMan(FILING_RULES.sideIncomeExemption)}以下のため、確定申告不要制度に当てはまります`)
    if (!exempt) outOfScopeReasons.push('公的年金があり、確定申告不要制度の条件に当てはまらない（年金の税額はこのアプリでは計算しません）')
  }

  // ── 所得控除 ──
  const deductionLines: Line[] = []
  const add = (label: string, value: number) => {
    if (value > 0) deductionLines.push({ label, value })
  }

  const employerSocial = has(a, 'salary') ? a.employers.reduce((s, e) => s + pos(e.socialInsurance), 0) : 0
  const socialInsurance =
    employerSocial +
    (paid(a, 'nationalPension') ? pos(a.nationalPension) : 0) +
    (paid(a, 'nationalHealth') ? pos(a.nationalHealth) : 0)
  add('社会保険料控除', socialInsurance)

  const ideco = paid(a, 'ideco') ? pos(a.ideco) : 0
  add('小規模企業共済等掛金控除（iDeCo）', ideco)

  const life = paid(a, 'lifeInsurance')
    ? calcLifeInsuranceDeduction(pos(a.lifeGeneral), pos(a.lifeMedicalCare), pos(a.lifePension))
    : 0
  add('生命保険料控除', life)

  const quake = paid(a, 'earthquake') ? calcEarthquakeDeduction(pos(a.earthquake)) : 0
  add('地震保険料控除', quake)

  const medical = paid(a, 'medical')
    ? calcMedicalDeduction(pos(a.medicalPaid) - pos(a.medicalReimbursed), inc.totalIncome)
    : 0
  add('医療費控除', medical)

  const donation = paid(a, 'donation') ? calcDonationDeduction(pos(a.donationAmount), inc.totalIncome) : 0
  add('寄付金控除', donation)

  let disabled = 0
  if (a.disability === 'self') disabled = DEDUCTION_AMOUNTS.disabled
  if (a.disability === 'selfSpecial') disabled = DEDUCTION_AMOUNTS.disabledSpecial
  if (a.disability === 'family') disabled = DEDUCTION_AMOUNTS.disabled
  if (a.disability === 'familySpecial') disabled = DEDUCTION_AMOUNTS.disabledSpecial
  add('障害者控除', disabled)

  const ws = workerStudentEligibility(p, a, inc)
  const workerStudent = ws === 'yes' ? DEDUCTION_AMOUNTS.workerStudent : 0
  add('勤労学生控除', workerStudent)
  if (ws === 'pending') pending.push('学校（課程）が勤労学生控除の対象か')

  // 配偶者・扶養家族
  let spouse = 0
  if (p.supports.includes('spouse')) {
    const spouseIncome = calcSalaryIncome(pos(a.spouseSalary)) + pos(a.spouseOtherIncome)
    const spouseAge = ageAtYearEnd(a.spouseBirthYear) ?? 0
    const r = calcSpouseDeduction(inc.totalIncome, spouseIncome, spouseAge)
    if (r) {
      spouse = r.amount
      add(r.label, r.amount)
    }
  }
  let dependents = 0
  for (const m of a.family) {
    const mAge = ageAtYearEnd(m.birthYear)
    if (mAge === null) continue
    const mIncome = calcSalaryIncome(pos(m.salary)) + pos(m.otherIncome)
    const d = calcDependentDeduction(mAge, mIncome, m.relation === 'parent' && m.livingTogether)
    if (d > 0) dependents += d
    else if (mAge >= 19 && mAge <= 22) dependents += calcSpecificRelativeDeduction(mIncome)
  }
  add('扶養控除・特定親族特別控除', dependents)

  const basic = calcBasicDeduction(inc.totalIncome)
  add('基礎控除', basic)

  const totalDeduction = deductionLines.reduce((s, l) => s + l.value, 0)
  const taxableIncome = Math.max(inc.totalIncome - totalDeduction, 0)
  const estimatedTax = calcIncomeTax(taxableIncome)

  const withheldTotal =
    (has(a, 'salary') ? a.employers.reduce((s, e) => s + pos(e.withheld), 0) : 0) +
    (has(a, 'freelance') ? pos(a.freelanceWithheld) : 0)

  // ── 所得の内訳（画面表示用） ──
  const incomeLines: Line[] = []
  if (inc.salaryTotal > 0) {
    incomeLines.push({ label: '給料の合計', value: inc.salaryTotal })
    incomeLines.push({ label: '給与所得（給与所得控除後）', value: inc.salaryIncome })
  }
  if (inc.miscBusiness > 0) incomeLines.push({ label: '業務委託・販売の所得', value: inc.miscBusiness })
  if (inc.miscOther > 0) incomeLines.push({ label: '謝礼・暗号資産の所得', value: inc.miscOther })
  if (inc.occasionalHalf > 0) incomeLines.push({ label: '懸賞の所得（一時所得の1/2）', value: inc.occasionalHalf })

  // ── 申告義務の判定 ──
  let obligation = false
  const hasSalary = inc.salaryTotal > 0
  const nonSalary = inc.nonSalaryIncome
  const sideLabel = formatMan(FILING_RULES.sideIncomeExemption)

  if (estimatedTax <= 0) {
    reasons.push('所得から控除を引くと、課税される所得税がありません')
  } else if (!hasSalary) {
    obligation = true
    reasons.push('給料以外の所得に所得税がかかります')
  } else if (inc.salaryTotal > FILING_RULES.salaryFilingRequired) {
    obligation = true
    reasons.push('給料が年2,000万円を超えています')
  } else {
    const employers = a.employers.filter((e) => pos(e.salary) > 0)
    const single =
      employers.length <= 1 ||
      (a.jobTiming === 'sequential' && a.prevSlipSubmitted === 'yes')
    if (a.jobTiming === 'sequential' && a.prevSlipSubmitted === 'unknown') {
      pending.push('前の勤務先の源泉徴収票を次の勤務先に出したか')
    }

    if (single) {
      if (nonSalary > FILING_RULES.sideIncomeExemption) {
        obligation = true
        reasons.push(`給料以外の所得が${sideLabel}を超えています`)
      } else {
        reasons.push(`給料が1か所で、給料以外の所得が${sideLabel}以下です`)
      }
    } else {
      // 主たる勤務先：扶養控除等申告書を出した勤務先（なければ最も給料が多い勤務先）
      const sorted = [...employers].sort((x, y) => pos(y.salary) - pos(x.salary))
      const main = sorted.find((e) => e.submittedForm === 'yes') ?? sorted[0]
      const subSalary = employers.filter((e) => e.id !== main.id).reduce((s, e) => s + pos(e.salary), 0)
      if (employers.some((e) => e.submittedForm === 'unknown' || e.submittedForm === '')) {
        pending.push('どの勤務先に扶養控除等申告書を出したか')
      }
      const mainAdjusted = main.yearEnd === 'done'
      if (main.yearEnd === 'unknown') pending.push('主な勤務先で年末調整を受けたか')

      const exempt1 = mainAdjusted && subSalary + nonSalary <= FILING_RULES.sideIncomeExemption
      // 給与収入から、雑損・医療費・寄付金・基礎控除以外の所得控除を引いた額
      const smallDeductions = socialInsurance + ideco + life + quake + disabled + workerStudent + spouse + dependents
      const exempt2 =
        inc.salaryTotal - smallDeductions <= FILING_RULES.multiJobSmallSalary &&
        nonSalary <= FILING_RULES.sideIncomeExemption

      if (exempt1) {
        reasons.push(`2か所目以降の給料と給料以外の所得の合計が${sideLabel}以下です`)
      } else if (exempt2) {
        reasons.push(`給料の合計から控除を引いた額が${formatMan(FILING_RULES.multiJobSmallSalary)}以下です`)
      } else {
        obligation = true
        reasons.push(`2か所以上から給料があり、2か所目以降の給料などが${sideLabel}を超えています`)
      }
    }
  }

  const diff = withheldTotal - estimatedTax
  let refundAmount = diff > 0 ? diff : 0
  const paymentAmount = diff < 0 ? -diff : 0
  let refundUnknown = false

  // 住宅ローン控除の1年目は確定申告で受ける（金額は試算しない）
  if (paid(a, 'housingLoan') && a.housingLoanFirstYear === 'yes') {
    refundUnknown = true
    notes.push({
      kind: 'housingLoan',
      tone: 'info',
      title: '住宅ローン控除（1年目）',
      body: '1年目は確定申告で受けます。控除額は借入残高の証明書などで計算するため、このアプリでは試算していません。',
    })
  }

  let status: DiagnosisOutcome['status']
  if (outOfScopeReasons.length > 0) status = 'outOfScope'
  else if (obligation) status = 'mustFile'
  else if (refundAmount > 0 || refundUnknown) status = 'refund'
  else status = 'noNeed'

  if (status === 'refund' && refundAmount > 0) {
    reasons.push(`引かれた所得税 ${formatYen(withheldTotal)} が、本来の所得税 ${formatYen(estimatedTax)} より多くなっています`)
  }
  if (status === 'outOfScope') refundAmount = 0

  // ── 住民税の申告 ──
  const filesIncomeTax = status === 'mustFile' || status === 'refund'
  if (!filesIncomeTax && nonSalary > 0) {
    notes.push({
      kind: 'residentTax',
      tone: 'warn',
      title: '住民税の申告',
      body: '給料以外の所得があるため、所得税の確定申告をしない場合も、市区町村への住民税の申告が必要です。',
    })
  } else if (filesIncomeTax) {
    notes.push({
      kind: 'residentTax',
      tone: 'info',
      title: '住民税の申告',
      body: '確定申告をすれば、住民税の申告は別にしなくてかまいません。',
    })
  }

  // ── 勤労学生控除の案内 ──
  if (ws === 'yes' && has(a, 'salary') && a.workerStudentClaimed !== 'yes' && !filesIncomeTax) {
    notes.push({
      kind: 'workerStudent',
      tone: 'info',
      title: '勤労学生控除',
      body: `条件に当てはまります。年末調整で申告していない場合、住民税の申告か確定申告で受けると、合計所得${formatMan(INCOME_REQUIREMENTS.residentTaxWorkerStudent)}以下なら住民税（所得割）がかからなくなります。`,
    })
  }

  // ── 家族の扶養への影響 ──
  if (p.dependentOf === 'parent' || p.dependentOf === 'spouse' || p.dependentOf === 'unknown') {
    const who = p.dependentOf === 'spouse' ? '配偶者' : '親など'
    if (inc.totalIncome <= INCOME_REQUIREMENTS.dependent) {
      notes.push({
        kind: 'dependent',
        tone: 'info',
        title: '家族の税金の扶養',
        body: `合計所得が${formatMan(INCOME_REQUIREMENTS.dependent)}以下のため、${who}は引き続き扶養控除（配偶者の場合は配偶者控除）を受けられます。`,
      })
    } else if (p.dependentOf === 'spouse') {
      const special = inc.totalIncome <= INCOME_REQUIREMENTS.spouseSpecialMax
      notes.push({
        kind: 'dependent',
        tone: 'warn',
        title: '家族の税金の扶養',
        body: special
          ? `合計所得が${formatMan(INCOME_REQUIREMENTS.dependent)}を超えるため、配偶者は配偶者控除ではなく配偶者特別控除（金額は段階的に減ります）になります。`
          : '合計所得が配偶者特別控除の上限を超えるため、配偶者は控除を受けられません。',
      })
    } else if (age !== null && age >= 19 && age <= 22 && inc.totalIncome <= INCOME_REQUIREMENTS.specificRelativeMax) {
      const amount = calcSpecificRelativeDeduction(inc.totalIncome)
      notes.push({
        kind: 'dependent',
        tone: 'warn',
        title: '家族の税金の扶養',
        body: `合計所得が${formatMan(INCOME_REQUIREMENTS.dependent)}を超えるため、${who}は扶養控除（${formatMan(DEPENDENT_DEDUCTION.specific)}）を受けられません。代わりに特定親族特別控除（${formatMan(amount)}）になります。${who}の勤務先への申告内容の変更が必要です。`,
      })
    } else {
      notes.push({
        kind: 'dependent',
        tone: 'warn',
        title: '家族の税金の扶養',
        body: `合計所得が${formatMan(INCOME_REQUIREMENTS.dependent)}を超えるため、${who}は扶養控除を受けられません。${who}の勤務先への申告内容の変更が必要です。`,
      })
    }
  }

  // ── 健康保険の扶養 ──
  if (p.insurance === 'familyEmployer') {
    const limit =
      p.dependentOf !== 'spouse' && age !== null && age >= 19 && age <= 22
        ? INCOME_WALLS.dependentInsurance1922
        : INCOME_WALLS.dependentInsurance
    const over = inc.insuranceIncome >= limit
    notes.push({
      kind: 'insurance',
      tone: over ? 'warn' : 'info',
      title: '健康保険の扶養',
      body: over
        ? `収入の合計が${formatMan(limit)}以上の見込みのため、家族の健康保険の扶養から外れる可能性があります。基準は加入している健康保険によって違うため、家族の勤務先の健康保険に確認してください。`
        : `収入の合計が${formatMan(limit)}未満の見込みのため、家族の健康保険の扶養の範囲内です（通勤手当も含めた見込みで判定されます）。`,
    })
  }

  // ── その他の案内 ──
  if (paid(a, 'donation') && a.oneStop === 'yes' && filesIncomeTax) {
    notes.push({
      kind: 'oneStop',
      tone: 'warn',
      title: 'ふるさと納税のワンストップ特例',
      body: '確定申告をするとワンストップ特例は使えなくなります。寄付した分も申告書に入れてください。',
    })
  }
  if (has(a, 'nonTaxable')) {
    notes.push({ kind: 'nonTaxable', tone: 'info', title: '税金がかからないお金', body: '奨学金・仕送り・お年玉・失業手当には所得税はかかりません。計算から外しています。' })
  }
  if (has(a, 'usedGoods') && a.soldValuable !== 'yes') {
    notes.push({ kind: 'nonTaxable', tone: 'info', title: '不用品の売却', body: '自分が使っていた物（1つ30万円以下）を売ったお金には、税金はかかりません。' })
  }
  if (has(a, 'stocks') && a.stockMethod !== 'other') {
    notes.push({ kind: 'nonTaxable', tone: 'info', title: '株・投資信託', body: 'NISA口座と、源泉徴収ありの特定口座での取引は、申告しなくてかまいません。' })
  }
  if (p.supports.includes('child') && !p.supports.includes('spouse')) {
    pending.push('ひとり親控除の対象か（このアプリでは計算していません）')
  }
  if (status === 'refund' && refundAmount > 0) {
    notes.push({ kind: 'check', tone: 'info', title: '還付申告の期間', body: `${TAX_YEAR + 1}年1月1日から${REFUND_LAST_DATE_LABEL}まで申告できます。` })
  }

  return {
    status,
    obligation: status === 'mustFile',
    refundAmount,
    paymentAmount: status === 'mustFile' ? paymentAmount : 0,
    refundUnknown,
    estimatedTax,
    withheldTotal,
    totalIncome: inc.totalIncome,
    taxableIncome,
    incomeLines,
    deductionLines,
    reasons,
    notes,
    pending,
    outOfScopeReasons,
  }
}
