import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDYlUovU9-wN4JskeT3_eTS-QZzRf3U9BA",
  authDomain: "zeminavi-app-21451.firebaseapp.com",
  projectId: "zeminavi-app-21451",
  storageBucket: "zeminavi-app-21451.firebasestorage.app",
  messagingSenderId: "815486468329",
  appId: "1:815486468329:web: a10d42484e98b9cb8f7078",
  measurementId: "G-1G0T42NWR6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const db = getFirestore(app)