import { NextResponse } from 'next/server';
import getConfig from 'next/config';

export async function GET() {
  // 서버 측 환경 변수 접근
  const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
  
  // 클라이언트에 필요한 최소한의 Firebase 설정만 제공
  const clientFirebaseConfig = {
    apiKey: serverRuntimeConfig.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: serverRuntimeConfig.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: serverRuntimeConfig.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: serverRuntimeConfig.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: serverRuntimeConfig.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: serverRuntimeConfig.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    measurementId: serverRuntimeConfig.FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
  };

  return NextResponse.json({ config: clientFirebaseConfig });
} 