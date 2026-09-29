import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import {
  firebaseEnv,
  recaptchaSiteKey,
  appCheckDebugToken,
  useEmulator,
} from './env'

const app = initializeApp({
  apiKey:            firebaseEnv.apiKey,
  authDomain:        firebaseEnv.authDomain,
  projectId:         firebaseEnv.projectId,
  storageBucket:     firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId:             firebaseEnv.appId,
  measurementId:     firebaseEnv.measurementId,
})

// App Check は他のサービスを使う前に初期化する必要がある
if (appCheckDebugToken && import.meta.env.DEV) {
  ;(globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
    appCheckDebugToken
}

if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
} else if (import.meta.env.PROD) {
  console.warn(
    'VITE_RECAPTCHA_SITE_KEY が未設定です。App Check が有効な環境ではAIチャットが利用できません。'
  )
}

export const firebaseApp = app
export const auth = getAuth(app)
export const db   = getFirestore(app)

if (import.meta.env.DEV && useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
