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
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* 앱 아이콘 */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-[#1C1C1E] rounded-[26px] shadow-xl flex items-center justify-center">
            <span className="text-5xl">🍴</span>
          </div>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight mb-1">식대 관리</h1>
          <p className="text-[15px] text-[#8E8E93]">식대 잔액을 간편하게 관리하세요</p>
        </div>

        {/* 로그인 버튼 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white rounded-2xl py-4 px-5 shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <GoogleIcon />
          <span className="text-[15px] font-semibold text-[#1C1C1E]">
            {loading ? '로그인 중...' : 'Google로 계속하기'}
          </span>
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center text-sm text-[#FF3B30]"
          >
            {error}
          </motion.p>
        )}

        <p className="text-center text-xs text-[#C7C7CC] mt-8">
          로그인하면 모든 기기에서 잔액이 동기화됩니다
        </p>
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
