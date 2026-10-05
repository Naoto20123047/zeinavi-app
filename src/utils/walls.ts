// 給料の「壁」：プロフィールに合わせて、その人に関係するものだけを並べる
import { INCOME_WALLS, formatMan } from '../config/taxConfig'
import type { Profile } from '../types/profile'
import { ageAtYearEnd } from './diagnose'

export interface Wall {
  id:     string
  amount: number
  /** メーターの目盛りに出す短い名前 */
  short:  string
  /** 超えたときに出す説明（1文） */
  body:   string
}

/** 給料（年収）だけで判定したときの、その人に関係する壁を金額の小さい順に返す */
export function relevantWalls(p: Profile): Wall[] {
  const age = ageAtYearEnd(p.birthYear)
  const is1922 = age !== null && age >= 19 && age <= 22
  const walls: Wall[] = [
    {
      id: 'residentTax',
      amount: INCOME_WALLS.residentTax,
      short: '住民税',
      body: `給料が${formatMan(INCOME_WALLS.residentTax)}を超えると、住民税がかかり始める目安です（市区町村によって少し違います）。`,
    },
  ]

  if (p.dependentOf === 'parent' || p.dependentOf === 'unknown') {
    walls.push({
      id: 'dependentTax',
      amount: INCOME_WALLS.dependentTax,
      short: '親の扶養',
      body: is1922
        ? `給料が${formatMan(INCOME_WALLS.dependentTax)}を超えると、親などの扶養控除は特定親族特別控除に切り替わり、控除額が段階的に減ります。`
        : `給料が${formatMan(INCOME_WALLS.dependentTax)}を超えると、親などの扶養控除の対象から外れます。`,
    })
  }
  if (p.dependentOf === 'spouse') {
    walls.push({
      id: 'dependentTax',
      amount: INCOME_WALLS.dependentTax,
      short: '配偶者控除',
      body: `給料が${formatMan(INCOME_WALLS.dependentTax)}を超えると、配偶者の控除が配偶者特別控除に変わり、金額が段階的に減ります。`,
    })
  }

  if (p.insurance === 'familyEmployer') {
    const limit = p.dependentOf !== 'spouse' && is1922
      ? INCOME_WALLS.dependentInsurance1922
      : INCOME_WALLS.dependentInsurance
    walls.push({
      id: 'dependentInsurance',
      amount: limit,
      short: '健康保険',
      body: `収入が${formatMan(limit)}以上になると、家族の健康保険の扶養から外れる可能性があります（通勤手当も含めて判定されます）。`,
    })
  }

  if (p.role === 'student') {
    walls.push({
      id: 'workerStudent',
      amount: INCOME_WALLS.workerStudent,
      short: '勤労学生',
      body: `給料が${formatMan(INCOME_WALLS.workerStudent)}を超えると、勤労学生控除が受けられなくなります。`,
    })
  }

  walls.push({
    id: 'incomeTax',
    amount: INCOME_WALLS.incomeTax,
    short: '所得税',
    body: `給料が${formatMan(INCOME_WALLS.incomeTax)}を超えると、給料だけでも所得税がかかり始めます。`,
  })

  return walls.sort((x, y) => x.amount - y.amount)
}

/** 前の金額から次の金額に増えたときに、新しく超えた壁 */
export function crossedWalls(walls: Wall[], before: number, after: number): Wall[] {
  return walls.filter((w) => !isOver(w, before) && isOver(w, after))
}

/** 壁を超えているか（健康保険は「以上」、税金は「超」で判定する） */
export function isOver(w: Wall, amount: number): boolean {
  return w.id === 'dependentInsurance' ? amount >= w.amount : amount > w.amount
}
