import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Mismo proyecto que la app (hanetcl/services/firebase.ts). La config web de
// Firebase es pública; la seguridad real vive en las reglas y en los claims.
const firebaseConfig = {
  apiKey: 'AIzaSyDK__CRF5iUlnGnRlembV9XUsnnajkFMaA',
  authDomain: 'hanet-edu.firebaseapp.com',
  projectId: 'hanet-edu',
  storageBucket: 'hanet-edu.firebasestorage.app',
  messagingSenderId: '283230293926',
  appId: '1:283230293926:web:b4b085556dbc5599760967',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const enrollmentDb = getFirestore(app, 'hn-enrollmentdata')
export const calendarDb = getFirestore(app, 'hn-calendar')
