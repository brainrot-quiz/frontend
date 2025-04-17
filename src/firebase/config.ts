import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import getConfig from 'next/config';

// 서버 측 환경 변수 접근
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };

// Firebase 앱 관련 상태 및 인스턴스
let app: FirebaseApp;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;
let analytics: any = null;

// 서버 사이드에서 사용할 Firebase 설정
const serverFirebaseConfig = {
  apiKey: serverRuntimeConfig.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: serverRuntimeConfig.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: serverRuntimeConfig.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: serverRuntimeConfig.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: serverRuntimeConfig.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: serverRuntimeConfig.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: serverRuntimeConfig.FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화 함수
async function initializeFirebase() {
  // 이미 초기화되어 있는지 확인
  if (getApps().length > 0) {
    app = getApp();
    db = getFirestore(app);
    storage = getStorage(app);
    return { app, db, storage, analytics };
  }

  let firebaseConfig;

  // 환경에 따라 다른 방식으로 설정 로드
  if (typeof window === 'undefined') {
    // 서버 사이드
    firebaseConfig = serverFirebaseConfig;
  } else {
    // 클라이언트 사이드: API를 통해 설정 로드
    try {
      const response = await fetch('/api/firebase-config');
      const data = await response.json();
      firebaseConfig = data.config;
    } catch (error) {
      console.error('Firebase 설정을 가져오는 중 오류가 발생했습니다:', error);
      // 오류 발생 시 처리 로직
      throw new Error('Firebase 설정을 로드할 수 없습니다');
    }
  }

  // Firebase 앱 초기화
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);

  // Analytics 초기화 (브라우저 환경 + 프로덕션 환경에서만)
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

  return { app, db, storage, analytics };
}

// 싱글톤 Firebase 인스턴스 내보내기
export async function getFirebaseInstance() {
  return await initializeFirebase();
}

// 기존 코드와의 호환성을 위해 직접 내보내기도 유지
// 하지만 이 방식은 클라이언트 컴포넌트에서만 안전하게 사용 가능
if (typeof window !== 'undefined') {
  // 클라이언트 사이드에서는 초기화 즉시 실행
  initializeFirebase().catch(error => 
    console.error('Firebase 초기화 오류:', error)
  );
}

export { app, db, storage, analytics }; 