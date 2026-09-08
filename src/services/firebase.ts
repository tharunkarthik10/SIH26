import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Active SIH 2026 Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBnbBx-rs8RvIG1hm97jylN3NYHaWic6_4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sih2026-d40b8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sih2026-d40b8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sih2026-d40b8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "122201308840",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:122201308840:web:675b53142e55e0b94ecc9d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5XM59P1FSN"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConfigured = true;
  console.log('[Firebase] Connected to Firebase Project:', firebaseConfig.projectId);
} catch (error) {
  console.warn('[Firebase] Initialization warning, using fallback local reactive database mode:', error);
}

export { app, auth, db, isFirebaseConfigured };
