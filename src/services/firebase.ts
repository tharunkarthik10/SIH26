import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Active SIH 2026 Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCnuhU1e5TgMnD2JGXTS0WIUKpKjdkMvVk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "h2sgas-7d3ae.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "h2sgas-7d3ae",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "h2sgas-7d3ae.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "973364448440",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:973364448440:web:5b54616fde653fab72f84d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7LRH7RC8VQ"
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
