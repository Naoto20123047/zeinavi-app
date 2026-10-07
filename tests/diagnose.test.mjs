// 判定エンジンのテスト（node tests/run.mjs で実行）
import { diagnose } from '../.test-build/diagnose.mjs'
import { EMPTY_ANSWERS } from '../.test-build/diagnosis.mjs'
import { EMPTY_PROFILE } from '../.test-build/profile.mjs'

const student = { ...EMPTY_PROFILE, role: 'student', birthYear: 2005, schoolType: 'university', enrollment: 'enrolled', dependentOf: 'parent', insurance: 'familyEmployer', onboardingDone: true }
const employee = { ...EMPTY_PROFILE, role: 'employee', birthYear: 1990, dependentOf: 'none', insurance: 'ownEmployer', onboardingDone: true }
const emp = (o) => ({ id: Math.random().toString(), name: '', salary: 0, withheld: 0, socialInsurance: 0, submittedForm: 'yes', yearEnd: 'done', ...o })
const A = (o) => ({ ...EMPTY_ANSWERS, ...o })

const cases = [
  ['学生・掛け持ち還付', student, A({ incomeKinds: ['salary'], jobCount: '2', jobTiming: 'concurrent', employers: [emp({ salary: 860000 }), emp({ salary: 420000, withheld: 9600, submittedForm: 'no', yearEnd: '' })] }),
    { status: 'refund', refundAmount: 9600, estimatedTax: 0 }],
  ['学生・ハンドメイドで申告必要', student, A({ incomeKinds: ['salary', 'sales'], jobCount: '1', employers: [emp({ salary: 1480000 })], salesRevenue: 620000, salesCost: 220000 }),
    { status: 'mustFile', estimatedTax: 5100, paymentAmount: 5100 }],
  ['会社員・副業25万', employee, A({ incomeKinds: ['salary', 'freelance'], jobCount: '1', employers: [emp({ salary: 5000000, socialInsurance: 720000, withheld: 91800 })], freelanceRevenue: 300000, freelanceExpense: 50000 }),
    { status: 'mustFile', estimatedTax: 109700, paymentAmount: 17900 }],
  ['会社員・副業15万', employee, A({ incomeKinds: ['salary', 'freelance'], jobCount: '1', employers: [emp({ salary: 5000000, socialInsurance: 720000, withheld: 91800 })], freelanceRevenue: 200000, freelanceExpense: 50000 }),
    { status: 'noNeed' }],
  ['給与なしフリーランス100万', { ...employee, role: 'freelance' }, A({ incomeKinds: ['freelance'], freelanceRevenue: 1200000, freelanceExpense: 200000 }),
    { status: 'noNeed', estimatedTax: 0 }],
  ['掛け持ち160万（税0）', employee, A({ incomeKinds: ['salary'], jobCount: '2', jobTiming: 'concurrent', employers: [emp({ salary: 1000000 }), emp({ salary: 600000, withheld: 18000, submittedForm: 'no', yearEnd: '' })] }),
    { status: 'refund', refundAmount: 18000 }],
  ['掛け持ち200万（申告必要）', employee, A({ incomeKinds: ['salary'], jobCount: '2', jobTiming: 'concurrent', employers: [emp({ salary: 1500000 }), emp({ salary: 500000, withheld: 15000, submittedForm: 'no', yearEnd: '' })] }),
    { status: 'mustFile', estimatedTax: 11200 }],
  ['掛け持ち2か所目10万（例外1）', employee, A({ incomeKinds: ['salary'], jobCount: '2', jobTiming: 'concurrent', employers: [emp({ salary: 3000000, withheld: 30000 }), emp({ salary: 100000, withheld: 3000, submittedForm: 'no', yearEnd: '' })] }),
    { obligation: false }],
  ['年金のみ200万', { ...employee, role: 'pensioner', birthYear: 1955 }, A({ incomeKinds: ['pension'], pensionAmount: 2000000, pensionWithheld: 'yes' }),
    { status: 'noNeed' }],
  ['海外居住', employee, A({ livedAbroad: 'yes', incomeKinds: ['salary'], employers: [emp({ salary: 3000000 })] }),
    { status: 'outOfScope' }],
  ['配偶者控除', { ...employee, supports: ['spouse'] }, A({ incomeKinds: ['salary'], jobCount: '1', employers: [emp({ salary: 6000000 })], spouseSalary: 1000000, spouseBirthYear: 1992 }),
    { deduction: ['配偶者控除', 380000] }],
  ['医療費5%ルール', student, A({ incomeKinds: ['salary'], jobCount: '1', employers: [emp({ salary: 1280000, withheld: 0 })], paidKinds: ['medical'], medicalPaid: 60000 }),
    { deduction: ['医療費控除', 60000 - 27000] }],
  ['勤労学生', student, A({ incomeKinds: ['salary'], jobCount: '1', employers: [emp({ salary: 1500000 })] }),
    { deduction: ['勤労学生控除', 270000] }],
  ['懸賞60万は一時所得5万', student, A({ incomeKinds: ['salary', 'prize'], jobCount: '1', employers: [emp({ salary: 1000000 })], prizeAmount: 600000 }),
    { totalIncome: 260000 + 50000 }],
]

let fail = 0
for (const [name, p, a, exp] of cases) {
  const r = diagnose(p, a)
  const errs = []
  for (const [k, v] of Object.entries(exp)) {
    if (k === 'deduction') {
      const line = r.deductionLines.find((l) => l.label === v[0])
      if (!line || line.value !== v[1]) errs.push(`${v[0]}: ${line?.value} != ${v[1]}`)
    } else if (r[k] !== v) errs.push(`${k}: ${r[k]} != ${v}`)
  }
  if (errs.length) { fail++; console.log('NG', name, errs.join(' / '), JSON.stringify({ status: r.status, tax: r.estimatedTax, reasons: r.reasons })) }
  else console.log('OK', name, `status=${r.status} tax=${r.estimatedTax} refund=${r.refundAmount} pay=${r.paymentAmount}`)
}
console.log(fail ? `${fail} 件失敗` : 'すべて成功')
process.exit(fail ? 1 : 0)
