/** 未設定なら起動時点で失敗させ、原因の分かりにくい実行時エラーを避ける */
function requireEnv(key: string): string {
  const value = import.meta.env[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `環境変数 ${key} が設定されていません。.env.example を参考に .env を作成してください。`
    )
  }
  return value
}

function optionalEnv(key: string): string | undefined {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

export const firebaseEnv = {
  apiKey:            requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             requireEnv('VITE_FIREBASE_APP_ID'),
  // 未設定でもアプリは動作し、計測のみ無効になる
  measurementId:     optionalEnv('VITE_FIREBASE_MEASUREMENT_ID'),
} as const

/** モデルの世代交代に追従できるよう環境変数で差し替え可能にしている */
export const aiModelName = optionalEnv('VITE_AI_MODEL') ?? 'gemini-3.7-flash'

/** Firebase AI Logic は App Check が必須のため、本番では必ず設定すること */
export const recaptchaSiteKey = optionalEnv('VITE_RECAPTCHA_SITE_KEY')

export const appCheckDebugToken = optionalEnv('VITE_APPCHECK_DEBUG_TOKEN')

export const useEmulator = optionalEnv('VITE_USE_EMULATOR') === 'true'

export const analyticsEnabled = Boolean(firebaseEnv.measurementId)
