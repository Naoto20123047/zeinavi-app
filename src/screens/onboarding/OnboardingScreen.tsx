// プロフィール登録（新規登録の直後と、設定からの変更で使う）
import { useState } from 'react'
import { RadioChoice, CheckChoice, HelpBox, Progress } from '../../components/ui'
import { TAX_YEAR } from '../../config/taxConfig'
import {
  ROLE_LABELS,
  SCHOOL_LABELS,
  ENROLLMENT_LABELS,
  SUPPORTED_LABELS,
  INSURANCE_LABELS,
  type Profile,
  type Role,
  type SchoolType,
  type Enrollment,
  type SupportedFamily,
  type InsuranceType,
} from '../../types/profile'

const STEPS = ['あなたについて', '生まれた年と学校', '扶養と家族', '保険証と地域'] as const

const ROLE_SUBS: Partial<Record<Role, string>> = {
  student:   'アルバイトや副業をしている人も',
  employee:  '副業がある人も',
  freelance: '業務委託の報酬が主な収入の人',
  pensioner: '公的年金が主な収入の人',
}

const BIRTH_YEARS = Array.from({ length: 90 }, (_, i) => TAX_YEAR - 14 - i)

export default function OnboardingScreen({ initial, mode, onSave, onSkip }: {
  initial: Profile
  mode: 'first' | 'edit'
  onSave: (p: Profile) => Promise<void> | void
  onSkip: () => void
}) {
  const [step, setStep]   = useState(0)
  const [draft, setDraft] = useState<Profile>(initial)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const isStudent = draft.role === 'student'
  const age = draft.birthYear ? TAX_YEAR - draft.birthYear : null

  const canNext = [
    draft.role !== '',
    draft.birthYear !== null && (!isStudent || (draft.schoolType !== '' && draft.enrollment !== '')),
    draft.dependentOf !== '' && draft.supports !== undefined,
    draft.insurance !== '',
  ][step]

  const toggleSupport = (v: SupportedFamily | 'none') => {
    if (v === 'none') { set('supports', []); return }
    const cur = draft.supports
    set('supports', cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }

  const finish = async () => {
    setSaving(true)
    try {
      await onSave({
        ...draft,
        // 学生以外は学校の情報を持たない
        schoolType: isStudent ? draft.schoolType : '',
        enrollment: isStudent ? draft.enrollment : '',
        onboardingDone: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : void finish())
  const back = () => (step > 0 ? setStep(step - 1) : onSkip())

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* PCだけのヘッダー */}
      <header className="hidden md:flex h-[76px] px-12 items-center justify-between bg-navy-900 text-white">
        <span className="font-display text-lg font-black">確定申告ナビ</span>
        <button type="button" onClick={onSkip} className="text-sm font-bold text-slate-400 hover:text-white">
          {mode === 'first' ? 'あとで設定する' : '変更せずに戻る'}
        </button>
      </header>

      <div className="flex-1 w-full max-w-[1040px] mx-auto md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-10 md:px-12 md:py-12">
        {/* PCの手順一覧 */}
        <nav aria-label="プロフィールの手順" className="hidden md:flex flex-col gap-1">
          <span className="text-xs font-bold tracking-wider text-muted px-3.5 pb-2">プロフィール設定</span>
          {STEPS.map((title, i) => (
            <span key={title} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold ${i === step ? 'bg-brand-50 text-brand-700' : 'text-muted'}`}>
              <span className={`w-[26px] h-[26px] rounded-full grid place-items-center text-xs ${
                i < step ? 'bg-brand-600 text-white' : i === step ? 'border-2 border-brand-600' : 'border-2 border-sand-400'
              }`}>{i < step ? '✓' : i + 1}</span>
              {title}
            </span>
          ))}
          <p className="text-[12.5px] leading-relaxed text-muted mt-4 px-3.5">入力した内容は本人だけが見られます。マイナンバーは聞きません。</p>
        </nav>

        <section className="flex flex-col gap-3 px-4 pb-7 md:card md:px-10 md:py-9 md:pt-9 min-h-screen md:min-h-0">
          {/* スマホのヘッダー */}
          <div className="md:hidden flex flex-col gap-3.5 pt-12">
            <div className="flex items-center justify-between h-11">
              <button type="button" onClick={back} aria-label="戻る" className="w-11 h-11 rounded-[14px] card grid place-items-center text-navy-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <span className="text-[13px] font-bold">プロフィール</span>
              <button type="button" onClick={onSkip} className="text-[13px] font-bold text-brand-600 w-11 text-right">あとで</button>
            </div>
            <Progress current={step + 1} total={STEPS.length} />
          </div>

          <span className="text-xs text-muted">{step + 1} / {STEPS.length}</span>

          {step === 0 && (
            <>
              <h1 className="font-display text-[25px] md:text-3xl font-black leading-snug m-0">今のあなたに近いものを選んでください</h1>
              <p className="text-[13px] md:text-sm text-muted leading-relaxed m-0">質問や画面の表示を合わせるために使います。あとから変更できます。</p>
              <div className="grid gap-2.5 md:grid-cols-2 md:gap-3.5 mt-1">
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <RadioChoice key={r} label={ROLE_LABELS[r]} sub={ROLE_SUBS[r]} selected={draft.role === r} onClick={() => set('role', r)} />
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-[25px] md:text-3xl font-black m-0">{isStudent ? '生まれた年と学校' : '生まれた年'}</h1>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="birth-year" className="text-[13px] font-bold">生まれた年</label>
                <select id="birth-year" className="field" value={draft.birthYear ?? ''} onChange={(e) => set('birthYear', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">選んでください</option>
                  {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
                </select>
                {age !== null && <span className="text-xs text-muted">{TAX_YEAR}年12月31日の時点で{age}歳です</span>}
              </div>
              {isStudent && (
                <>
                  <span className="text-[13px] font-bold mt-2">通っている学校</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Object.keys(SCHOOL_LABELS) as SchoolType[]).map((s) => (
                      <button key={s} type="button" className="choice justify-center text-center text-[13.5px] min-h-[46px] py-2" aria-pressed={draft.schoolType === s} onClick={() => set('schoolType', s)}>
                        {SCHOOL_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] font-bold mt-2">在籍の状態</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(ENROLLMENT_LABELS) as Enrollment[]).map((e) => (
                      <button key={e} type="button" className="choice justify-center text-center text-[13px] min-h-[46px] py-2 px-2" aria-pressed={draft.enrollment === e} onClick={() => set('enrollment', e)}>
                        {ENROLLMENT_LABELS[e]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted leading-relaxed m-0">夜間・通信制・定時制も「在学している」です。学校と在籍の状態は、勤労学生控除の対象になるかの判定に使います。</p>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-[25px] md:text-3xl font-black m-0">扶養と家族</h1>
              <div className="grid gap-6 md:grid-cols-2 md:gap-8 mt-1">
                <div className="flex flex-col gap-2">
                  <span className="text-sm md:text-[15px] font-bold">家族の扶養に入っていますか？</span>
                  <RadioChoice label="入っている（親）" selected={draft.dependentOf === 'parent'} onClick={() => set('dependentOf', 'parent')} />
                  <RadioChoice label="入っている（配偶者）" selected={draft.dependentOf === 'spouse'} onClick={() => set('dependentOf', 'spouse')} />
                  <RadioChoice label="入っていない" selected={draft.dependentOf === 'none'} onClick={() => set('dependentOf', 'none')} />
                  <RadioChoice label="わからない" muted selected={draft.dependentOf === 'unknown'} onClick={() => set('dependentOf', 'unknown')} />
                  <HelpBox title="扶養とは？">
                    親などが、税金や健康保険の手続きで「養っている家族」として届け出ている状態です。親の勤務先の書類や、保険証の「被扶養者」の表記で確認できます。
                  </HelpBox>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm md:text-[15px] font-bold">あなたが養っている家族はいますか？</span>
                  {(Object.keys(SUPPORTED_LABELS) as SupportedFamily[]).map((s) => (
                    <CheckChoice key={s} label={SUPPORTED_LABELS[s]} checked={draft.supports.includes(s)} onClick={() => toggleSupport(s)} />
                  ))}
                  <CheckChoice label="いない" checked={draft.supports.length === 0} onClick={() => toggleSupport('none')} />
                  <p className="text-[12.5px] text-muted leading-relaxed m-0">選んだ家族がいる場合は、診断のときに収入を聞いて、配偶者控除や扶養控除を計算します。</p>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-display text-[25px] md:text-3xl font-black m-0">保険証と住んでいる地域</h1>
              <span className="text-sm font-bold mt-1">病院で使う保険証（資格確認書）は、どれですか？</span>
              <div className="flex flex-col gap-2">
                {(Object.keys(INSURANCE_LABELS) as InsuranceType[]).map((t) => (
                  <RadioChoice key={t} label={INSURANCE_LABELS[t]} muted={t === 'unknown'} selected={draft.insurance === t} onClick={() => set('insurance', t)} />
                ))}
              </div>
              <p className="text-xs text-muted leading-relaxed m-0">保険証に「被扶養者」とあれば、家族の勤務先の健康保険です。</p>
              <div className="flex flex-col gap-1.5 mt-2">
                <label htmlFor="city" className="text-sm font-bold">住民票のある市区町村（任意）</label>
                <input id="city" className="field" placeholder="例：新潟市中央区" value={draft.city} onChange={(e) => set('city', e.target.value)} />
                <span className="text-xs text-muted">住民税がかかり始める年収の目安は、地域によって少し違います。</span>
              </div>
              <p className="md:hidden text-[11.5px] text-muted text-center leading-relaxed mt-2 mb-0">入力した内容は本人だけが見られます。マイナンバーは聞きません。</p>
            </>
          )}

          <div className="mt-auto md:mt-4 pt-4 flex gap-3 md:justify-between">
            {step > 0 && (
              <button type="button" onClick={back} className="btn-secondary hidden md:flex w-[140px]">戻る</button>
            )}
            <button type="button" disabled={!canNext || saving} onClick={next} className="btn-primary flex-1 md:flex-none md:w-[220px] md:ml-auto">
              {step < STEPS.length - 1 ? '次へ' : saving ? '保存中…' : mode === 'first' ? '設定してはじめる' : '保存する'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
