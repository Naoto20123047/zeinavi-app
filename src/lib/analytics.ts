// Google Analytics 4（Firebase Analytics）
//
// 非対応環境でもアプリが壊れないよう、初期化は非同期かつ失敗許容にし、
// 完了前に発生したイベントはキューに積んで後から送る。
// 個人情報（メールアドレス・氏名・金額の実数など）はイベントパラメータに含めないこと。
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  type Analytics,
} from 'firebase/analytics'
import { firebaseApp } from './firebase'
import { analyticsEnabled } from './env'

type EventParams = Record<string, string | number | boolean | undefined>

let analytics: Analytics | null = null
let ready = false
const queue: Array<() => void> = []

function flushQueue() {
  while (queue.length > 0) {
    const task = queue.shift()
    try {
      task?.()
    } catch {
      // 計測の失敗でアプリを止めない
    }
  }
}

/** 初期化。main.tsx から一度だけ呼ぶ */
export async function initAnalytics(): Promise<void> {
  if (!analyticsEnabled) {
    ready = true
    queue.length = 0
    return
  }
  try {
    if (await isSupported()) {
      analytics = getAnalytics(firebaseApp)
    }
  } catch {
    analytics = null
  } finally {
    ready = true
    flushQueue()
  }
}

/** 初期化前に呼ばれてもイベントを取りこぼさない */
function run(task: () => void) {
  if (!analyticsEnabled) return
  if (!ready) {
    if (queue.length < 30) queue.push(task)
    return
  }
  if (!analytics) return
  try {
    task()
  } catch {
    // 計測の失敗でアプリを止めない
  }
}

export function trackEvent(name: string, params: EventParams = {}) {
  run(() => logEvent(analytics!, name, params))
}

/** SPA なので画面遷移のたびに手動で送る */
export function trackScreenView(screenName: string) {
  run(() =>
    logEvent(analytics!, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
      page_title: screenName,
    })
  )
}

/** 渡してよいのは uid のみ。メールアドレス等の個人情報は渡さないこと */
export function setAnalyticsUser(uid: string | null) {
  run(() => setUserId(analytics!, uid))
}

/** 直書きによる表記ゆれを防ぐため、イベント名はここに集約する */
export const AnalyticsEvents = {
  login:              'login',
  signUp:             'sign_up',
  logout:             'logout',
  diagnosisStart:     'diagnosis_start',
  diagnosisComplete:  'diagnosis_complete',
  chatMessageSent:    'chat_message_sent',
  chatLimitReached:   'chat_limit_reached',
  quickQuestionUsed:  'quick_question_used',
  recordAdded:        'record_added',
  recordDeleted:      'record_deleted',
  checklistToggled:   'checklist_item_toggled',
  checklistReset:     'checklist_reset',
  guideCaseViewed:    'guide_case_viewed',
} as const
