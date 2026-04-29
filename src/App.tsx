import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginScreen from './LoginScreen';

interface Transaction {
  id: string;
  type: 'expense' | 'charge';
  amount: number;
  label: string;
  timestamp: number;
}

interface Preset {
  id: string;
  label: string;
  amount: number;
  emoji: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [lastAction, setLastAction] = useState<Transaction | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [initAmount, setInitAmount] = useState('');

  const [presets] = useState<Preset[]>([
    { id: 'lunch', label: '점심', amount: 7000, emoji: '🍱' },
    { id: 'coffee-l', label: '커피 L', amount: 1500, emoji: '☕' },
    { id: 'coffee-s', label: '커피 S', amount: 990, emoji: '🥤' },
  ]);

  // 인증 상태 감지
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // Firestore 실시간 동기화
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions ?? []);
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
        setShowInitModal(true);
      }
    });
    return unsub;
  }, [user]);

  // Undo 타이머
  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => setShowUndo(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const save = (newBalance: number, newTransactions: Transaction[]) => {
    if (!user) return;
    setDoc(doc(db, 'users', user.uid), {
      balance: newBalance,
      transactions: newTransactions,
    });
  };

  const handleSetInitialBalance = () => {
    const amount = parseFloat(initAmount);
    if (isNaN(amount) || amount < 0) return;
    save(amount, transactions);
    setInitAmount('');
    setShowInitModal(false);
  };

  const handleExpense = (amount: number, label: string) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      amount,
      label,
      timestamp: Date.now(),
    };
    const newBalance = balance - amount;
    const newTransactions = [transaction, ...transactions];
    setBalance(newBalance);
    setTransactions(newTransactions);
    save(newBalance, newTransactions);
    setLastAction(transaction);
    setShowUndo(true);
  };

  const handleCharge = () => {
    const amount = parseFloat(chargeAmount);
    if (!amount || amount <= 0) return;
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'charge',
      amount,
      label: '잔액 충전',
      timestamp: Date.now(),
    };
    const newBalance = balance + amount;
    const newTransactions = [transaction, ...transactions];
    setBalance(newBalance);
    setTransactions(newTransactions);
    save(newBalance, newTransactions);
    setLastAction(transaction);
    setShowUndo(true);
    setChargeAmount('');
    setShowChargeModal(false);
  };

  const handleCustomExpense = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0 || !customLabel.trim()) return;
    handleExpense(amount, customLabel);
    setCustomAmount('');
    setCustomLabel('');
    setShowCustomModal(false);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    const newBalance = lastAction.type === 'expense'
      ? balance + lastAction.amount
      : balance - lastAction.amount;
    const newTransactions = transactions.filter(t => t.id !== lastAction.id);
    setBalance(newBalance);
    setTransactions(newTransactions);
    save(newBalance, newTransactions);
    setLastAction(null);
    setShowUndo(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return `오늘 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('ko-KR');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-20">
      {/* 헤더 */}
      <div className="max-w-md mx-auto pt-8 pb-6 relative">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
          🍴 식대 관리
        </h1>
        <p className="text-sm text-slate-500 text-center">Personal Meal Budget Tracker</p>
        <div className="absolute right-2 top-8 flex items-center gap-2">
          <button
            onClick={() => { setInitAmount(balance.toString()); setShowInitModal(true); }}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="잔액 설정"
          >
            ⚙️
          </button>
          <button
            onClick={() => signOut(auth)}
            title={`${user.displayName ?? ''} · 로그아웃`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full border-2 border-slate-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 잔액 카드 */}
      <motion.div
        className="max-w-md mx-auto mb-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className={`rounded-3xl p-8 shadow-xl ${
          balance < 7000
            ? 'bg-gradient-to-br from-red-500 to-pink-600'
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          <div className="text-white/80 text-sm font-medium mb-2">현재 잔액</div>
          <motion.div
            key={balance}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold text-white mb-4"
          >
            {formatCurrency(balance)}원
          </motion.div>
          {balance < 7000 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-white/90 text-sm"
            >
              <span className="text-xl">⚠️</span>
              <span>점심 1회 결제가 어려운 금액입니다</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 되돌리기 버튼 */}
      <AnimatePresence>
        {showUndo && lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto mb-4"
          >
            <button
              onClick={handleUndo}
              className="w-full bg-slate-800 text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 font-medium"
            >
              <span>↩️</span>
              <span>방금 내역 되돌리기</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 퀵 액션 */}
      <div className="max-w-md mx-auto mb-6">
        <h2 className="text-sm font-semibold text-slate-600 mb-3 px-2">빠른 차감</h2>
        <div className="grid grid-cols-3 gap-3">
          {presets.map((preset) => (
            <motion.button
              key={preset.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExpense(preset.amount, preset.label)}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">{preset.emoji}</div>
              <div className="text-sm font-semibold text-slate-800">{preset.label}</div>
              <div className="text-xs text-slate-500 mt-1">-{formatCurrency(preset.amount)}원</div>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCustomModal(true)}
            className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <span className="text-xl">✏️</span>
            <span className="text-sm font-semibold text-slate-800">직접 입력</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChargeModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <span className="text-xl">💰</span>
            <span className="text-sm font-semibold text-white">충전하기</span>
          </motion.button>
        </div>
      </div>

      {/* 히스토리 */}
      <div className="max-w-md mx-auto">
        <h2 className="text-sm font-semibold text-slate-600 mb-3 px-2">최근 내역</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-sm">아직 내역이 없습니다</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.slice(0, 20).map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 mb-1">{transaction.label}</div>
                    <div className="text-xs text-slate-500">{formatDate(transaction.timestamp)}</div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'charge' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'charge' ? '+' : '-'}{formatCurrency(transaction.amount)}원
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 초기 잔액 설정 모달 */}
      <AnimatePresence>
        {showInitModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2">⚙️ 잔액 설정</h3>
              <p className="text-sm text-slate-500 mb-4">현재 보유한 식대 잔액을 입력해주세요</p>
              <input
                type="number"
                value={initAmount}
                onChange={(e) => setInitAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetInitialBalance()}
                placeholder="잔액을 입력하세요"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                {!isNewUser && (
                  <button
                    onClick={() => setShowInitModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={handleSetInitialBalance}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium"
                >
                  설정
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 충전 모달 */}
      <AnimatePresence>
        {showChargeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowChargeModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">💰 잔액 충전</h3>
              <input
                type="number"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCharge()}
                placeholder="충전 금액을 입력하세요"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleCharge}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium"
                >
                  충전
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 커스텀 차감 모달 */}
      <AnimatePresence>
        {showCustomModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCustomModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">✏️ 직접 입력</h3>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="항목명 (예: 간식, 음료 등)"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none mb-3"
                autoFocus
              />
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomExpense()}
                placeholder="금액을 입력하세요"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleCustomExpense}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium"
                >
                  차감
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
