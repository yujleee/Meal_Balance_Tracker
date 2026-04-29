import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center"
      >
        <div className="text-6xl mb-4">🍴</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">식대 관리</h1>
        <p className="text-sm text-slate-500 mb-8">Personal Meal Budget Tracker</p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-700 hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {loading ? '로그인 중...' : 'Google로 로그인'}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </motion.div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default LoginScreen;
