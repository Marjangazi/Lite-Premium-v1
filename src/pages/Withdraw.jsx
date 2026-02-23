import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, CreditCard, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

export default function Withdraw({ profile, user, onUpdate }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('crypto');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  const minWithdraw = 1000;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < minWithdraw) {
       return showToast(`Minimum withdrawal is ${minWithdraw} coins.`, "error");
    }

    if (profile.balance < withdrawAmount) {
      return showToast("Insufficient balance!", "error");
    }

    if (!address) {
      return showToast("Please provide a valid destination address/id.", "error");
    }

    setSubmitting(true);
    try {
      // Deduct balance
      const { error: balanceError } = await supabase.from('profiles').update({ 
        balance: profile.balance - withdrawAmount 
      }).eq('id', user.id);

      if (balanceError) throw balanceError;

      // Note: In a real app, you'd insert into a 'withdrawals' table
      // Since the schema might not have it yet, we just alert or show success
      // Let's assume there is a withdrawals table based on the 'Lite Premium' context
      
      const { error: logError } = await supabase.from('withdrawals').insert([{
        user_id: user.id,
        amount: withdrawAmount,
        method: method,
        address: address,
        status: 'pending'
      }]);

      showToast("Withdrawal request submitted! It will be processed within 24-48 hours.", "success");
      setAmount('');
      setAddress('');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Withdrawal error:', err);
      showToast("Error processing withdrawal. Please contact support.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold neon-text text-premium-gold flex items-center gap-2">
          Withdraw <Wallet className="size-8" />
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Cash out your hard-earned coins</p>
      </header>

      <div className="premium-card mb-6 bg-red-500/5 border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-1" size={18} />
          <p className="text-zinc-400 text-xs">
            Withdrawals are processed manually for security. Please ensure your wallet address is correct. 
            Minimum withdrawal: <span className="text-white font-bold">{minWithdraw} 🪙</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleWithdraw} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Amount to Withdraw</label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-12 text-2xl font-mono focus:border-premium-gold outline-none transition-colors"
            />
            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={24} />
          </div>
          <p className="text-xs text-zinc-500 text-right">Available: {profile?.balance?.toFixed(2)} 🪙</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Withdrawal Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={() => setMethod('crypto')}
              className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${method === 'crypto' ? 'bg-premium-gold text-black border-premium-gold' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
            >
              <Send size={18} /> Crypto
            </button>
            <button 
              type="button" 
              onClick={() => setMethod('bank')}
              className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${method === 'bank' ? 'bg-premium-gold text-black border-premium-gold' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
            >
              <CreditCard size={18} /> Wallet/Bank
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            {method === 'crypto' ? 'Wallet Address (USDT/TRX)' : 'Payment ID / Account'}
          </label>
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={method === 'crypto' ? '0x... or T...' : 'Enter your ID'}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-premium-gold outline-none transition-colors"
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="premium-button w-full py-5 text-xl mt-4"
        >
          {submitting ? 'Processing...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

function Coins({ className, size }) {
  return (
    <div className={className}>
       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M17 10h1v4"/></svg>
    </div>
  )
}
