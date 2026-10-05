// 確定申告の診断：1画面1問で進み、答えるたびに見込み額を計算し直す
import { useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../../components/AppShell'
import { Icons } from '../../components/Icons'
import { Progress } from '../../components/ui'
import { useDiagnosisResults } from '../../hooks/useDiagnosisResult'
import { trackEvent, AnalyticsEvents } from '../../lib/analytics'
import { TAX_YEAR } from '../../config/taxConfig'
import type { Profile } from '../../types/profile'
import { EMPTY_ANSWERS, type DiagnosisAnswers } from '../../types/diagnosis'
import { diagnose, summarizeIncome } from '../../utils/diagnose'
import { relevantWalls, crossedWalls, type Wall } from '../../utils/walls'
import { visibleSteps, isStepAnswered, STEP_GROUP, type StepId } from './steps'
import StepContent from './StepContent'
import { EstimatePanel, ResultHero, ResultDetails } from './ResultParts'

type Phase = 'intro' | 'questions' | 'result'

/** 「いまの見込み」を出し始める質問（受け取ったお金を答えたあと） */
const ESTIMATE_FROM: StepId = 'incomeKinds'

export default function DiagnosisScreen({ onNavigate, profile }: {
  onNavigate: (s: string) => void
  profile: Profile
}) {
  const { latestResult, saveResult } = useDiagnosisResults()
  const [phase, setPhase]     = useState<Phase>('intro')
  const [answers, setAnswers] = useState<DiagnosisAnswers>(EMPTY_ANSWERS)
  const [current, setCurrent] = useState<StepId>('confirm')
  const [toast, setToast]     = useState<Wall | null>(null)
  const [saving, setSaving]   = useState(false)
  const shownWalls = useRef<Set<string>>(new Set())
  const mainRef = useRef<HTMLDivElement>(null)

  const steps   = useMemo(() => visibleSteps(profile, answers), [profile, answers])
  const outcome = useMemo(() => diagnose(profile, answers), [profile, answers])
  const walls   = useMemo(() => relevantWalls(profile), [profile])

  // 前の回答で消えた質問にいた場合は、残っている直前の質問に戻る
  const index = Math.max(steps.indexOf(current), 0)
  const stepId = steps[index]
  const answered = isStepAnswered(stepId, answers)
  const showEstimate = index > steps.indexOf(ESTIMATE_FROM)

  const previous = latestResult?.answers?.version === 2 ? (latestResult.answers as DiagnosisAnswers) : null

  // 壁の通知は数秒で消す
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(t)
  }, [toast])

  const update = (patch: Partial<DiagnosisAnswers>) => {
    // 入力のたびに呼ばれるため、画面に出ている回答をもとに次の回答を作る
    const nextAnswers = { ...answers, ...patch }
    setAnswers(nextAnswers)
    // 給料の合計が壁を超えたら、それぞれ1回だけ知らせる
    const before = summarizeIncome(answers).salaryTotal
    const after = summarizeIncome(nextAnswers).salaryTotal
    const crossed = crossedWalls(walls, before, after).filter((w) => !shownWalls.current.has(w.id))
    if (crossed.length > 0) {
      crossed.forEach((c) => shownWalls.current.add(c.id))
      setToast(crossed[crossed.length - 1])
    }
  }

  const scrollTop = () => {
    window.scrollTo({ top: 0 })
    mainRef.current?.focus({ preventScroll: true })
  }

  const start = (from: DiagnosisAnswers) => {
    setAnswers({ ...from, profileConfirmed: false })
    setCurrent('confirm')
    shownWalls.current = new Set()
    setPhase('questions')
    trackEvent(AnalyticsEvents.diagnosisStart, { resumed: from !== EMPTY_ANSWERS })
    scrollTop()
  }

  const finish = async () => {
    setSaving(true)
    try {
      await saveResult(outcome.status, answers)
    } catch (e) {
      console.error('診断結果の保存に失敗しました', e)
    }
    // 回答の中身は送らず、結果の分類だけを計測する
    trackEvent(AnalyticsEvents.diagnosisComplete, {
      result_type: outcome.status,
      role: profile.role || 'none',
      question_count: steps.length,
    })
    setSaving(false)
    setPhase('result')
    scrollTop()
  }

  const next = () => {
    if (!answered) return
    if (index >= steps.length - 1) {
      void finish()
      return
    }
    setCurrent(steps[index + 1])
    scrollTop()
  }

  const back = () => {
    if (index === 0) {
      setPhase('intro')
    } else {
      setCurrent(steps[index - 1])
    }
    scrollTop()
  }

  // ── はじめの画面 ──
  if (phase === 'intro') {
    return (
      <AppShell active="diagnose" onNavigate={onNavigate}>
        <main className="flex-1 px-5 md:px-12 py-8 md:py-12 max-w-[760px] w-full mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-brand-600">{TAX_YEAR}年分（令和8年分）の診断</span>
            <h1 className="font-display text-[28px] md:text-[34px] font-black leading-snug m-0">
              確定申告が必要か、<br className="md:hidden" />いくら戻るかを調べます
            </h1>
            <p className="text-sm text-muted leading-relaxed m-0">
              質問に順番に答えると、申告が必要かどうかと、納める額・戻る額の見込みがわかります。
            </p>
          </div>

          <div className="card p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold">手元にあると正確になるもの</span>
              <ul className="text-[13.5px] leading-relaxed m-0 pl-5 list-disc">
                <li>源泉徴収票（勤務先ごと）</li>
                <li>国民年金・生命保険などの控除証明書</li>
                <li>医療費やふるさと納税の領収書</li>
              </ul>
            </div>
            <p className="text-[13px] text-muted leading-relaxed m-0 border-t border-sand-200 pt-3">
              なくても始められます。わからない質問は「わからない」を選んでください。確認が必要な点は、結果の画面でまとめてお伝えします。
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button type="button" className="btn-primary md:flex-1" onClick={() => start(EMPTY_ANSWERS)}>
              はじめる
            </button>
            {previous && (
              <button type="button" className="btn-secondary md:flex-1" onClick={() => start(previous)}>
                前回の回答を使って見直す
              </button>
            )}
          </div>
          <p className="text-xs text-muted m-0">所要時間の目安：5〜10分。途中で画面を閉じると、回答は保存されません。</p>
        </main>
      </AppShell>
    )
  }

  // ── 結果 ──
  if (phase === 'result') {
    const primary =
      outcome.status === 'mustFile' || outcome.status === 'refund'
        ? { label: '申告の手順を見る', to: 'guide' }
        : outcome.status === 'outOfScope'
          ? { label: 'AIに相談する', to: 'chat' }
          : { label: 'ホームに戻る', to: 'home' }
    return (
      <AppShell active="diagnose" onNavigate={onNavigate}>
        <main ref={mainRef} tabIndex={-1} className="flex-1 px-5 md:px-12 py-8 md:py-12 max-w-[1080px] w-full mx-auto outline-none">
          <div className="flex flex-col gap-2 mb-6">
            <span className="text-xs font-bold text-brand-600">診断結果</span>
            <h1 className="font-display text-2xl md:text-3xl font-black m-0">{TAX_YEAR}年分の判定</h1>
          </div>
          <div className="md:grid md:grid-cols-[1fr_360px] md:gap-8 flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              <ResultHero outcome={outcome} />
              <ResultDetails outcome={outcome} />
            </div>
            <aside className="flex flex-col gap-3 md:sticky md:top-8 self-start w-full">
              <button type="button" className="btn-primary" onClick={() => onNavigate(primary.to)}>{primary.label}</button>
              {(outcome.status === 'mustFile' || outcome.status === 'refund') && (
                <button type="button" className="btn-secondary" onClick={() => onNavigate('check')}>必要な書類を確認する</button>
              )}
              <button type="button" className="btn-secondary" onClick={() => { setPhase('questions'); scrollTop() }}>回答を直す</button>
              <button type="button" className="text-sm text-muted underline py-2" onClick={() => start(EMPTY_ANSWERS)}>はじめからやり直す</button>
            </aside>
          </div>
        </main>
      </AppShell>
    )
  }

  // ── 質問 ──
  const isLast = index >= steps.length - 1
  return (
    <AppShell active="diagnose" onNavigate={onNavigate} hideBottomNav>
      {toast && (
        <div role="status" className="anim-toast fixed top-4 inset-x-4 md:left-auto md:right-8 md:w-[380px] z-50 rounded-2xl bg-navy-900 text-white p-4 shadow-lg flex gap-3">
          <span className="w-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs font-bold text-slate-300">{toast.short}の壁を超えました</span>
            <span className="text-[13px] leading-relaxed">{toast.body}</span>
          </div>
          <button type="button" aria-label="閉じる" className="text-slate-300 text-sm self-start" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* スマホの上部 */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur px-5 pt-4 pb-3 flex flex-col gap-2.5 border-b border-sand-200">
        <div className="flex items-center justify-between">
          <button type="button" onClick={back} className="flex items-center gap-1 text-sm text-muted -ml-1" aria-label="前の質問へ">
            {Icons.back}戻る
          </button>
          <span className="text-xs text-muted">{STEP_GROUP[stepId]}・{index + 1}/{steps.length}</span>
          <button type="button" onClick={() => onNavigate('home')} className="text-sm text-muted">中断</button>
        </div>
        <Progress current={index + 1} total={steps.length} />
      </header>

      <div className="flex-1 md:grid md:grid-cols-[1fr_340px] md:gap-10 px-5 md:px-12 pt-6 md:pt-12 pb-40 md:pb-12 max-w-[1120px] w-full mx-auto">
        <main ref={mainRef} tabIndex={-1} className="flex flex-col gap-6 outline-none min-w-0">
          {/* PCの上部 */}
          <div className="hidden md:flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-bold text-brand-600">{STEP_GROUP[stepId]}</span>
              <span>{index + 1} / {steps.length}</span>
            </div>
            <Progress current={index + 1} total={steps.length} />
          </div>

          <StepContent
            id={stepId}
            profile={profile}
            answers={answers}
            update={update}
            onEditProfile={() => onNavigate('profile')}
          />

          <div className="hidden md:flex gap-3 pt-2">
            <button type="button" className="btn-secondary w-40" onClick={back}>戻る</button>
            <button type="button" className="btn-primary flex-1" disabled={!answered || saving} onClick={next}>
              {isLast ? (saving ? '保存しています' : '結果を見る') : '次へ'}
            </button>
          </div>
        </main>

        <aside className="hidden md:flex flex-col gap-3 sticky top-12 self-start">
          {showEstimate ? (
            <EstimatePanel outcome={outcome} />
          ) : (
            <div className="card p-5 text-[13px] text-muted leading-relaxed">
              受け取ったお金を答えると、ここに納める額・戻る額の見込みが出ます。
            </div>
          )}
        </aside>
      </div>

      {/* スマホの下部：見込みと次へ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-sand-300 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex flex-col gap-2.5">
        {showEstimate && <EstimatePanel outcome={outcome} compact />}
        <button type="button" className="btn-primary w-full" disabled={!answered || saving} onClick={next}>
          {isLast ? (saving ? '保存しています' : '結果を見る') : '次へ'}
        </button>
      </div>
    </AppShell>
  )
}
