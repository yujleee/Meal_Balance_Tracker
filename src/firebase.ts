import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 콘솔 > 프로젝트 설정 > 내 앱에서 복사한 값으로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyCmsKF7BjtdAQ_dYzMJ7SAq7F6W_MVSUKQ",
  authDomain: "meal-balance-tracker.firebaseapp.com",
  projectId: "meal-balance-tracker",
  storageBucket: "meal-balance-tracker.firebasestorage.app",
  messagingSenderId: "95006284142",
  appId: "1:95006284142:web:081f5dcbac74802389097f",
  measurementId: "G-M37MSJP259"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
