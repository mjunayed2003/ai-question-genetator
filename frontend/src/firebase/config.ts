import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

// Strict check to ensure user has provided genuine Firebase web credentials
export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey.trim().length > 10 &&
  !apiKey.includes('your-') &&
  !apiKey.includes('your_') &&
  !apiKey.includes('DummyKey') &&
  projectId &&
  projectId.trim().length > 0 &&
  !projectId.includes('your-')
);

// Fallback config so initializeApp does not crash if user hasn't added .env values yet
const firebaseConfig = {
  apiKey: isFirebaseConfigured ? apiKey : 'AIzaSyDummyKeyForAppInitialization_00',
  authDomain: authDomain || 'ai-question-generator-b38ab.firebaseapp.com',
  projectId: projectId || 'ai-question-generator-b38ab',
  storageBucket: storageBucket || 'ai-question-generator-b38ab.firebasestorage.app',
  messagingSenderId: messagingSenderId || '283652198402',
  appId: appId || '1:283652198402:web:5412b0f4c0c30f07fd571b',
  ...(measurementId ? { measurementId } : {}),
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});


