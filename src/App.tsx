import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
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

const EXPENSE_ICONS: Record<string, string> = {
  '점심': '🍱',
  '커피 L': '☕',
  '커피 S': '🥤',
  '잔액 충전': '💳',
};

const getIcon = (label: string, type: 'expense' | 'charge') => {
  if (type === 'charge') return '💳';
  return EXPENSE_ICONS[label] ?? '🍽️';
};

const TransactionItem = ({
  transaction,
  onDelete,
  formatDate,
  formatCurrency,
}: {
  transaction: Transaction;
  onDelete: (id: string) => void;
  formatDate: (ts: number) => string;
  formatCurrency: (amount: number) => string;
}) => {
  const controls = useAnimation();
  const [open, setOpen] = useState(false);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldOpen = info.offset.x < -36 || info.velocity.x < -200;
    setOpen(shouldOpen);
    controls.start({ x: shouldOpen ? -80 : 0, transition: { type: 'spring', stiffness: 400, damping: 40 } });
  };

  const close = () => {
    setOpen(false);
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 40 } });
  };

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="absolute right-0 inset-y-0 w-20 bg-[#FF3B30] flex items-center justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          <span className="text-[11px] font-semibold">삭제</span>
        </button>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.05}
        dragDirectionLock
        animate={controls}
        onDragEnd={handleDragEnd}
        onClick={open ? close : undefined}
        className="relative bg-white px-4 py-3 flex items-center gap-3"
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base ${
          transaction.type === 'charge' ? 'bg-emerald-50' : 'bg-slate-50'
        }`}>
          {getIcon(transaction.label, transaction.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-[#1C1C1E] leading-tight">{transaction.label}</div>
          <div className="text-xs text-[#8E8E93] mt-0.5">{formatDate(transaction.timestamp)}</div>
        </div>
        <div className={`text-[15px] font-semibold tabular-nums ${
          transaction.type === 'charge' ? 'text-[#34C759]' : 'text-[#1C1C1E]'
        }`}>
          {transaction.type === 'charge' ? '+' : '-'}{formatCurrency(transaction.amount)}원
        </div>
      </motion.div>
    </div>
  );
};

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

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

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

  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => setShowUndo(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const save = (newBalance: number, newTransactions: Transaction[]) => {
    if (!user) return;
    setDoc(doc(db, 'users', user.uid), { balance: newBalance, transactions: newTransactions });
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
      id: Date.now().toString(), type: 'expense', amount, label, timestamp: Date.now(),
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
      id: Date.now().toString(), type: 'charge', amount, label: '잔액 충전', timestamp: Date.now(),
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

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;
    const newBalance = target.type === 'expense'
      ? balance + target.amount
      : balance - target.amount;
    const newTransactions = transactions.filter(t => t.id !== id);
    setBalance(newBalance);
    setTransactions(newTransactions);
    save(newBalance, newTransactions);
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
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="text-[#8E8E93] text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-10">

      {/* 헤더 */}
      <div className="px-4 pt-14 pb-2 flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">식대 관리</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setInitAmount(balance.toString()); setShowInitModal(true); }}
            className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#8E8E93]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button onClick={() => signOut(auth)} title="로그아웃">
            {user.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#8E8E93] flex items-center justify-center text-white text-sm font-semibold">
                {user.displayName?.[0] ?? '?'}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 잔액 카드 */}
      <div className="px-4 mt-3">
        <motion.div
          className="bg-white rounded-3xl px-6 pt-5 pb-6 shadow-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-[13px] text-[#8E8E93] font-medium mb-2 tracking-wide">현재 잔액</div>
          <motion.div key={balance} initial={{ scale: 1.04 }} animate={{ scale: 1 }} className="flex items-end gap-1">
            <span className="text-[44px] font-bold text-[#1C1C1E] tracking-tight leading-none">
              {formatCurrency(balance)}
            </span>
            <span className="text-xl font-semibold text-[#8E8E93] mb-1">원</span>
          </motion.div>
          {balance < 7000 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center gap-1.5 bg-rose-50 rounded-full px-3 py-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs text-rose-500 font-medium">잔액 부족</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* 되돌리기 */}
      <AnimatePresence>
        {showUndo && lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="px-4 mt-3"
          >
            <button
              onClick={handleUndo}
              className="w-full bg-white rounded-2xl py-3.5 shadow-sm flex items-center justify-center gap-2 text-[15px] font-medium text-[#007AFF]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
              </svg>
              방금 내역 되돌리기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 빠른 차감 */}
      <div className="mt-6 px-4">
        <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 px-1">빠른 차감</p>
        <div className="grid grid-cols-3 gap-3">
          {presets.map((preset) => (
            <motion.button
              key={preset.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleExpense(preset.amount, preset.label)}
              className="bg-white rounded-2xl px-2 py-4 shadow-sm flex flex-col items-center gap-2"
            >
              <span className="text-3xl">{preset.emoji}</span>
              <span className="text-[13px] font-semibold text-[#1C1C1E]">{preset.label}</span>
              <span className="text-[11px] text-[#8E8E93]">-{formatCurrency(preset.amount)}원</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowCustomModal(true)}
            className="bg-white rounded-2xl py-4 shadow-sm flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span className="text-[14px] font-semibold text-[#1C1C1E]">직접 입력</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowChargeModal(true)}
            className="bg-[#007AFF] rounded-2xl py-4 shadow-sm flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="text-[14px] font-semibold text-white">충전하기</span>
          </motion.button>
        </div>
      </div>

      {/* 히스토리 */}
      <div className="mt-6 px-4">
        <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 px-1">최근 내역</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-[#8E8E93]">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-sm">아직 내역이 없습니다</div>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F2F7]">
              <AnimatePresence>
                {transactions.slice(0, 20).map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                  >
                    <TransactionItem
                      transaction={transaction}
                      onDelete={handleDeleteTransaction}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* 잔액 설정 Bottom Sheet */}
      <AnimatePresence>
        {showInitModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => !isNewUser && setShowInitModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-[#D1D1D6]" />
              </div>
              <div className="px-6 pb-10 pt-2">
                <h3 className="text-[18px] font-bold text-[#1C1C1E] mb-1">잔액 설정</h3>
                <p className="text-sm text-[#8E8E93] mb-5">현재 보유한 식대 잔액을 입력해주세요</p>
                <input
                  type="number"
                  value={initAmount}
                  onChange={(e) => setInitAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSetInitialBalance()}
                  placeholder="0"
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[16px] focus:outline-none mb-3"
                  autoFocus
                />
                <div className="flex gap-3">
                  {!isNewUser && (
                    <button onClick={() => setShowInitModal(false)}
                      className="flex-1 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[15px] font-semibold">
                      취소
                    </button>
                  )}
                  <button onClick={handleSetInitialBalance}
                    className="flex-1 py-3.5 rounded-xl bg-[#007AFF] text-white text-[15px] font-semibold">
                    설정
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 충전 Bottom Sheet */}
      <AnimatePresence>
        {showChargeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowChargeModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-[#D1D1D6]" />
              </div>
              <div className="px-6 pb-10 pt-2">
                <h3 className="text-[18px] font-bold text-[#1C1C1E] mb-5">잔액 충전</h3>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCharge()}
                  placeholder="충전 금액을 입력하세요"
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[16px] focus:outline-none mb-3"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowChargeModal(false)}
                    className="flex-1 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[15px] font-semibold">
                    취소
                  </button>
                  <button onClick={handleCharge}
                    className="flex-1 py-3.5 rounded-xl bg-[#34C759] text-white text-[15px] font-semibold">
                    충전
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 직접 입력 Bottom Sheet */}
      <AnimatePresence>
        {showCustomModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowCustomModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-[#D1D1D6]" />
              </div>
              <div className="px-6 pb-10 pt-2">
                <h3 className="text-[18px] font-bold text-[#1C1C1E] mb-5">직접 입력</h3>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="항목명 (예: 간식, 음료 등)"
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[16px] focus:outline-none mb-2"
                  autoFocus
                />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomExpense()}
                  placeholder="금액을 입력하세요"
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[16px] focus:outline-none mb-3"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-3.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-[15px] font-semibold">
                    취소
                  </button>
                  <button onClick={handleCustomExpense}
                    className="flex-1 py-3.5 rounded-xl bg-[#007AFF] text-white text-[15px] font-semibold">
                    차감
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
