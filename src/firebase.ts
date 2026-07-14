import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Console > 프로젝트 설정 > 내 앱의 웹 설정값
export const firebaseConfig = {
  apiKey: 'AIzaSyBH9wy8EMJnc8VK2qKJAQhQcO5HCKOEawI',
  authDomain: 'vibe-coding-88fba.firebaseapp.com',
  projectId: 'vibe-coding-88fba',
  storageBucket: 'vibe-coding-88fba.firebasestorage.app',
  messagingSenderId: '712429656291',
  appId: '1:712429656291:web:3ee6e576f554628dd94dd6',
};

export const firebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  value.includes('YOUR_'),
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);
