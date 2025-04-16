import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase 설정 - 환경변수가 없는 경우에 대비한 하드코딩된 값
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCUAykzHtVbCpM_h6BY2BCl0vf2B1xgEZw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "brainrot-quiz-cc64f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brainrot-quiz-cc64f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "brainrot-quiz-cc64f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "599155970271",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:599155970271:web:e02db5e40267f9fe36196a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-B8YLZZXRX8"
};

// Firebase 앱이 이미 초기화되어 있는지 확인
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore 및 Storage 인스턴스 생성
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics 초기화 (브라우저 환경 + 프로덕션 환경에서만)
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics 초기화 성공');
  } catch (error) {
    console.error('Firebase Analytics 초기화 오류:', error);
  }
} else {
  console.log('개발 환경이거나 서버 환경이므로 Firebase Analytics를 초기화하지 않습니다');
}

export { app, db, storage, analytics }; 