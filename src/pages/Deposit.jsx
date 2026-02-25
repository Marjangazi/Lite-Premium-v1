import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, CreditCard, Send, PlusCircle, History, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

export default function Deposit({ profile, user, onUpdate }) {
  const [activeTab, setActiveTab] = useState('request'); // 'request' or 'history'
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bkash');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const showToast = useToast();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, activeTab]);

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
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return showToast("Please enter a valid amount.", "error");
    }

    if (!trxId) {
      return showToast("Please enter the Transaction ID.", "error");
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('coin_requests').insert([{
        user_id: user.id,
        email: user.email,
        amount: depositAmount,
        method: method,
        transaction_id: trxId,
        status: 'pending'
      }]);

      if (error) throw error;

      showToast("Deposit request submitted! Admin will verify and add coins soon.", "success");
      setAmount('');
      setTrxId('');
      setActiveTab('history');
    } catch (err) {
      console.error('Deposit error:', err);
      showToast("Error submitting request. Transaction ID might already exist.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold neon-text text-premium-gold flex items-center gap-2">
          Add Coins <PlusCircle className="size-8" />
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Purchase coins via local payment methods</p>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('request')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'request' ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
        >
          <CreditCard size={18} /> Request
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
        >
          <History size={18} /> History
        </button>
      </div>

      {activeTab === 'request' ? (
        <form onSubmit={handleDeposit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Amount of Coins</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-premium-gold outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['Bkash', 'Nagad', 'Rocket'].map((m) => (
                <button 
                  key={m}
                  type="button" 
                  onClick={() => setMethod(m)}
                  className={`py-3 rounded-lg border font-bold transition-all ${method === m ? 'bg-premium-gold text-black border-premium-gold' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-card bg-zinc-900/50 border-dashed border-zinc-700">
            <p className="text-xs text-zinc-500 mb-2">Send money to our {method} number: <span className="text-white font-mono font-bold">01XXXXXXXXX</span></p>
            <p className="text-[10px] text-zinc-600">After sending, enter your Transaction ID below.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Transaction ID</label>
            <input 
              type="text" 
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="Enter TrxID"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-premium-gold outline-none transition-colors font-mono"
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="premium-button w-full py-5 text-xl"
          >
            {submitting ? 'Submitting...' : 'Confirm Request'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No requests found.</div>
          ) : (
            history.map((req) => (
              <div key={req.id} className="premium-card flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{req.amount.toLocaleString()} 🪙</h3>
                  <p className="text-xs text-zinc-500">{new Date(req.created_at).toLocaleDateString()} via {req.method}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${
                    req.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    req.status === 'rejected' ? 'bg-red-500/10 text-red-100 border-red-500/20' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {req.status === 'approved' && <CheckCircle size={10} />}
                    {req.status === 'rejected' && <XCircle size={10} />}
                    {req.status === 'pending' && <Clock size={10} />}
                    {req.status}
                  </span>
                  <p className="text-[10px] font-mono text-zinc-600 mt-1">{req.transaction_id}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
