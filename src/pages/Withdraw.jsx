import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, CreditCard, Send, AlertTriangle, Clock, ShieldCheck, History, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useToast } from '../lib/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const COIN_TO_BDT = 720;

export default function Withdraw({ profile, user, onUpdate }) {
  const [activeTab, setActiveTab] = useState('request');
  const [amountCoins, setAmountCoins] = useState('');
  const [method, setMethod] = useState('Bkash');
  const [number, setNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    fetchSettings();
    if (user) {
      fetchHistory();
    }
    if (profile?.bdt_number) {
      setNumber(profile.bdt_number);
    }
  }, [user, activeTab, profile]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('admin_settings').select('*').eq('id', 'global').single();
    if (data) setSettings(data);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const coins = parseFloat(amountCoins);
    const minWithdraw = settings?.min_withdraw || 7200;
    
    if (isNaN(coins) || coins < minWithdraw) return showToast(`Minimum exit volume is ${minWithdraw.toLocaleString()} Coins.`, "error");
    if (profile.balance < coins) return showToast("Capital Reserves Insufficient!", "error");
    if (!number) return showToast("Financial endpoint (number) required.", "error");

    setSubmitting(true);
    try {
      const bdt = coins / COIN_TO_BDT;
      
      // 1. Deduct balance first (Atomic safety)
      const { error: balError } = await supabase.from('profiles').update({ 
        balance: profile.balance - coins 
      }).eq('id', user.id);
      if (balError) throw balError;

      // 2. Log request
      const { error: logError } = await supabase.from('withdrawals').insert([{
        user_id: user.id,
        email: user.email,
        amount_coins: coins,
        amount_bdt: bdt,
        method: method,
        number: number,
        status: 'pending'
      }]);
      if (logError) throw logError;

      showToast("Liquidity exit initiated. Processing window active.", "success");
      setAmountCoins('');
      setNumber('');
      setActiveTab('history');
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast("Protocol failure. Contact System Oversight.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-10 pb-40">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500 rounded-2xl shadow-neon-red group transition-all">
             <LogOut className="text-white size-8 group-hover:-translate-x-1 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Capital <span className="text-red-500">Exit</span></h1>
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest mt-2 leading-none">Exchange: {COIN_TO_BDT} Coins = 1 BDT</p>
          </div>
        </div>
      </header>

      <div className="bg-zinc-950/50 p-6 border-2 border-zinc-900 rounded-[2.5rem] flex items-start gap-5 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform"><Clock size={100} /></div>
         <div className="p-3 bg-red-500/10 rounded-2xl relative z-10">
            <Clock className="text-red-500 size-6 animate-pulse" />
         </div>
         <div className="relative z-10">
            <p className="text-white text-xs font-black uppercase tracking-widest leading-none">Processing Protocol</p>
            <p className="text-zinc-500 text-[10px] font-bold uppercase mt-2 italic tracking-tighter">10:00 AM — 06:00 PM (GMT+6)</p>
         </div>
      </div>

      <div className="flex bg-zinc-950/80 p-2 rounded-[2rem] border-2 border-zinc-900 sticky top-4 z-50 backdrop-blur-2xl">
        {['request', 'history'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all duration-500 ${activeTab === tab ? 'bg-red-500 text-white shadow-neon-red scale-[1.02]' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            {tab === 'request' ? 'Terminal' : 'Registry'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'request' ? (
          <motion.form 
            key="request"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            onSubmit={handleWithdraw} 
            className="space-y-8"
          >
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block ml-2">Liquidity Amount (Coins)</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={amountCoins}
                    onChange={(e) => setAmountCoins(e.target.value)}
                    placeholder={`Min ${settings?.min_withdraw || 7200} Coins`}
                    className="w-full bg-zinc-900/50 border-2 border-zinc-900 rounded-[2.5rem] py-8 px-10 text-white focus:border-red-500 focus:bg-black outline-none transition-all font-mono font-black text-3xl placeholder:text-zinc-800"
                  />
                  {amountCoins && (
                     <div className="absolute right-8 top-1/2 -translate-y-1/2 text-red-500 font-black italic text-xs bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 shadow-neon-red/5">
                       = ৳ {(parseFloat(amountCoins) / COIN_TO_BDT).toFixed(2)} VAL
                     </div>
                  )}
                </div>
                <div className="flex justify-between items-center px-4">
                   <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Withdrawal Limit: {settings?.min_withdraw?.toLocaleString() || '7,200'} 🪙</p>
                   <p className="text-[9px] font-black italic text-zinc-600 uppercase">Available: {profile?.balance?.toLocaleString()} 🪙</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block ml-2">Payout Channel</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Bkash', 'Nagad', 'Rocket'].map((m) => (
                    <button 
                      key={m}
                      type="button" 
                      onClick={() => setMethod(m)}
                      className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all duration-300 ${method === m ? 'bg-red-500/10 border-red-500 text-red-500 shadow-neon-red/10 scale-[1.05]' : 'bg-transparent border-zinc-900 text-zinc-700 hover:border-zinc-800'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block ml-2">Cash Out Number (bKash/Nagad/Rocket)</label>
                <input 
                  type="text" 
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-zinc-900/50 border-2 border-zinc-900 rounded-[2.5rem] py-8 px-10 text-white focus:border-red-500 focus:bg-black outline-none transition-all font-mono font-black tracking-[0.2em] text-xl placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-[2rem] border-2 border-zinc-900 flex gap-5 shadow-inner">
               <ShieldCheck className="text-zinc-800 size-10 flex-shrink-0" />
               <p className="text-[9px] text-zinc-700 font-bold leading-relaxed uppercase tracking-tight">
                 Compliance Notice: To prevent unauthorized capital flight, all exit requests undergo multi-layered audit verification. Ensure destination number is registered and active.
               </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="h-24 bg-red-500 text-white rounded-[2.5rem] shadow-neon-red hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center relative overflow-hidden group border-4 border-black/20 font-black italic tracking-tighter text-2xl uppercase"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
              {submitting ? (
                 <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Finalize Liquidation'
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {history.length === 0 ? (
              <div className="text-center py-32 bg-zinc-950 border-2 border-dashed border-zinc-900 rounded-[3rem]">
                 <History className="text-zinc-800 size-16 mx-auto mb-6 opacity-40" />
                 <p className="text-zinc-700 text-xs font-black uppercase tracking-[0.5em]">Log database empty</p>
              </div>
            ) : (
              history.map((req) => (
                <div key={req.id} className="premium-card p-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-all group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-6 transition-transform"><CheckCircle size={100} /></div>
                  <div className="space-y-4 relative z-10 w-full sm:w-auto text-center sm:text-left">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black font-mono text-zinc-100 italic tracking-tighter">{req.amount_coins?.toLocaleString()} 🪙</h3>
                       <p className="text-[9px] font-black text-red-500 tracking-widest italic opacity-60">৳ {req.amount_bdt?.toFixed(2)} VAL</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                       <span className="text-[8px] font-black bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg uppercase text-zinc-500 tracking-widest">{req.method}</span>
                       <span className="text-[10px] font-mono font-black text-zinc-700 tracking-tighter uppercase">{req.number}</span>
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-0 flex flex-col items-center sm:items-end gap-3 relative z-10">
                    <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-zinc-900 text-zinc-600 border-zinc-800'
                    }`}>
                      {req.status === 'approved' && <CheckCircle size={14} />}
                      {req.status === 'rejected' && <XCircle size={14} />}
                      {req.status === 'pending' && <Clock size={14} className="animate-spin" />}
                      {req.status === 'approved' ? 'Disbursed' : req.status === 'rejected' ? 'Invalid' : 'Verification'}
                    </div>
                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
