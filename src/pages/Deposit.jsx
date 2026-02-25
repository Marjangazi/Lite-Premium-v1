import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, CreditCard, Send, PlusCircle, History, Clock, CheckCircle, XCircle, ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '../lib/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const COIN_TO_BDT = 720;

export default function Deposit({ user }) {
  const [activeTab, setActiveTab] = useState('request');
  const [amountBdt, setAmountBdt] = useState('');
  const [method, setMethod] = useState('Bkash');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    fetchSettings();
    if (user) {
      fetchHistory();
    }
  }, [user, activeTab]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('admin_settings').select('*').eq('id', 'global').single();
    if (data) setSettings(data);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('coin_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const bdt = parseFloat(amountBdt);
    if (isNaN(bdt) || bdt < 10) return showToast("Minimum deposit is 10 BDT.", "error");
    if (!trxId) return showToast("Transaction ID is required.", "error");

    setSubmitting(true);
    try {
      const { error } = await supabase.from('coin_requests').insert([{
        user_id: user.id,
        email: user.email,
        amount_bdt: bdt,
        coins_to_add: bdt * COIN_TO_BDT,
        method: method,
        transaction_id: trxId,
        status: 'pending'
      }]);

      if (error) {
        if (error.code === '23505') throw new Error("This Transaction ID has already been submitted.");
        throw error;
      }

      showToast("Deposit request received! Verification takes 15-60 mins.", "success");
      setAmountBdt('');
      setTrxId('');
      setActiveTab('history');
    } catch (err) {
      showToast(err.message || "Submission failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-10 pb-40">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-premium-gold rounded-2xl shadow-neon-gold group transition-all">
             <PlusCircle className="text-black size-8 group-hover:rotate-90 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Capital <span className="text-premium-gold">Inflow</span></h1>
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest mt-2 leading-none">Protocol: 1 BDT = {COIN_TO_BDT} Coins</p>
          </div>
        </div>
      </header>

      <div className="flex bg-zinc-950/80 p-2 rounded-[2rem] border-2 border-zinc-900 sticky top-4 z-50 backdrop-blur-2xl">
        {['request', 'history'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all duration-500 ${activeTab === tab ? 'bg-premium-gold text-black shadow-neon-gold scale-[1.02]' : 'text-zinc-600 hover:text-zinc-400'}`}
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
            onSubmit={handleDeposit} 
            className="space-y-8"
          >
            <div className="premium-card p-1 space-y-2 overflow-hidden bg-zinc-950 border-zinc-900">
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block ml-1">Secure Provider</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Bkash', 'Nagad', 'Rocket'].map((m) => (
                      <button 
                        key={m}
                        type="button" 
                        onClick={() => setMethod(m)}
                        className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all duration-300 ${method === m ? 'bg-premium-gold/10 border-premium-gold text-premium-gold shadow-neon-gold/10 scale-[1.05]' : 'bg-transparent border-zinc-900 text-zinc-700 hover:border-zinc-800'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-black/80 p-6 rounded-[2rem] border-2 border-zinc-900 space-y-4 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700"><ShieldCheck size={120} /></div>
                  <div className="space-y-1 relative z-10">
                    <p className="text-[9px] text-zinc-700 uppercase font-black tracking-widest">Merchant Vector</p>
                    <div className="flex justify-between items-center">
                       <p className="text-2xl font-mono font-black text-white italic tracking-tighter">{settings?.cashout_number || '+8801875354842'}</p>
                       <button 
                        type="button"
                        onClick={() => {
                          const num = settings?.cashout_number || '+8801875354842';
                          navigator.clipboard.writeText(num);
                          showToast("Terminal number encoded!", "success");
                        }}
                        className="p-4 bg-premium-gold text-black rounded-2xl shadow-neon-gold active:scale-90 transition-all"
                       >
                         <Copy size={20} />
                       </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-900 relative z-10">
                     <AlertCircle size={14} className="text-red-500 animate-pulse" />
                     <p className="text-[9px] text-zinc-600 font-black uppercase italic tracking-tighter leading-none">
                       System Command: "Send Money" protocol only.
                     </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-zinc-700 tracking-widest block ml-2">Injection Amount (BDT)</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={amountBdt}
                    onChange={(e) => setAmountBdt(e.target.value)}
                    placeholder="Min 10 BDT"
                    className="w-full bg-zinc-900/50 border-2 border-zinc-800 rounded-[2rem] py-8 px-10 text-white focus:border-premium-gold focus:bg-black outline-none transition-all font-mono font-black text-3xl placeholder:text-zinc-800"
                  />
                  {amountBdt && (
                     <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-premium-gold font-black italic text-xs bg-premium-gold/10 px-4 py-2 rounded-xl border border-premium-gold/20 shadow-neon-gold/5"
                     >
                       = {(parseFloat(amountBdt) * COIN_TO_BDT).toLocaleString()} 🪙
                     </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-zinc-700 tracking-widest block ml-2">Verification Vector (TrxID)</label>
                <input 
                  type="text" 
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="ID-HASH-PROTOCOL"
                  className="w-full bg-zinc-900/50 border-2 border-zinc-800 rounded-[2.5rem] py-8 px-10 text-white focus:border-premium-gold focus:bg-black outline-none transition-all font-mono font-black tracking-[0.2em] uppercase text-xl placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="bg-red-500/5 border-2 border-red-500/10 p-6 rounded-[2rem] flex gap-5">
               <ShieldCheck className="text-red-500 size-10 flex-shrink-0 opacity-40" />
               <p className="text-[9px] text-zinc-600 font-bold leading-relaxed uppercase tracking-tight">
                 Identity & Trust Protocol: Submission of fraudulent verification vectors (TrxID) will lead to permanent terminal termination and capital seizure. All logs are recorded.
               </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="h-24 bg-premium-gold text-black rounded-[2.5rem] shadow-neon-gold hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center relative overflow-hidden group border-4 border-black/20"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
              {submitting ? (
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl font-black italic tracking-tighter uppercase leading-none">Execute Capital Load</span>
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
                       <h3 className="text-xl font-black font-mono text-zinc-100 italic tracking-tighter">{req.coins_to_add?.toLocaleString() || (req.amount_bdt * COIN_TO_BDT).toLocaleString()} 🪙</h3>
                       <p className="text-[9px] font-black text-premium-gold tracking-widest italic opacity-60">৳ {req.amount_bdt} CAP</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                       <span className="text-[8px] font-black bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg uppercase text-zinc-500 tracking-widest">{req.method}</span>
                       <span className="text-[10px] font-mono font-black text-zinc-700 tracking-tighter uppercase">{req.transaction_id}</span>
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
                      {req.status === 'approved' ? 'Verified' : req.status === 'rejected' ? 'Invalid' : 'Processing'}
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
