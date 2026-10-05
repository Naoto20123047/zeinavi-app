// プロフィール（アカウント登録時に一度だけ聞く、年によって変わりにくい情報）
// 保存先：users/{uid}/profile/main（本人だけが読み書きできるルールにすること）

export type Role =
  | 'student'
  | 'employee'
  | 'partTime'
  | 'freelance'
  | 'pensioner'
  | 'other'

export type SchoolType =
  | 'university'
  | 'juniorCollege'
  | 'kosen'
  | 'vocational'
  | 'highSchool'
  | 'otherSchool'

/** 在籍の状態。通学・夜間・通信制・定時制で税金の扱いは変わらないため、休学中かどうかだけを聞く */
export type Enrollment = 'enrolled' | 'leave'

/** 家族の扶養に入っているか */
export type DependentOf = 'parent' | 'spouse' | 'none' | 'unknown'

/** 自分が養っている家族 */
export type SupportedFamily = 'spouse' | 'child' | 'parent'

/** 保険証（資格確認書）の種類 */
export type InsuranceType = 'familyEmployer' | 'ownEmployer' | 'national' | 'unknown'

export interface Profile {
  role:           Role | ''
  birthYear:      number | null
  schoolType:     SchoolType | ''
  enrollment:     Enrollment | ''
  dependentOf:    DependentOf | ''
  supports:       SupportedFamily[]
  insurance:      InsuranceType | ''
  city:           string
  onboardingDone: boolean
}

export const EMPTY_PROFILE: Profile = {
  role:           '',
  birthYear:      null,
  schoolType:     '',
  enrollment:     '',
  dependentOf:    '',
  supports:       [],
  insurance:      '',
  city:           '',
  onboardingDone: false,
}

export const ROLE_LABELS: Record<Role, string> = {
  student:   '学生',
  employee:  '会社員・公務員',
  partTime:  'パート・アルバイト（学生ではない）',
  freelance: 'フリーランス・個人事業主',
  pensioner: '年金を受け取っている',
  other:     'その他',
}

export const SCHOOL_LABELS: Record<SchoolType, string> = {
  university:    '大学・大学院',
  juniorCollege: '短期大学',
  kosen:         '高等専門学校',
  vocational:    '専修学校・専門学校',
  highSchool:    '高校',
  otherSchool:   'その他の学校',
}

/** 以前の選択肢（通学・夜間など）で保存されたデータを、今の選択肢に読み替える */
export function normalizeEnrollment(v: unknown): Enrollment | '' {
  if (v === 'leave') return 'leave'
  if (v === 'enrolled' || v === 'day' || v === 'evening') return 'enrolled'
  return ''
}

export const ENROLLMENT_LABELS: Record<Enrollment, string> = {
  enrolled: '在学している',
  leave:    '休学している',
}

export const DEPENDENT_OF_LABELS: Record<DependentOf, string> = {
  parent:  '親の扶養に入っている',
  spouse:  '配偶者の扶養に入っている',
  none:    '扶養に入っていない',
  unknown: 'わからない',
}

export const SUPPORTED_LABELS: Record<SupportedFamily, string> = {
  spouse: '配偶者',
  child:  '子ども',
  parent: '親など',
}

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  familyEmployer: '家族の勤務先の健康保険',
  ownEmployer:    '自分の勤務先の健康保険',
  national:       '国民健康保険',
  unknown:        'わからない',
}
