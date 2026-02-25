import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Coins, TrendingUp, Clock, UserPlus } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

export default function Dashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    const { data } = await supabase.from('user_investments').select('*').eq('user_id', user.id);
    if (data) setInvestments(data);
  };

  const fetchProfile = async () => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (!data) {
        // Fallback if trigger hasn't finished (rare)
        const { data: newP, error: insertError } = await supabase.from('profiles').insert([
          { 
            id: user.id, 
            email: user.email, 
            balance: 1000, 
            worker_level: 'Starter',
            mining_rate: 0.1
          }
        ]).select().single();
        
        if (insertError && insertError.code !== '23505') throw insertError; // 23505 is duplicate key (trigger might have won)
        if (newP) setProfile(newP);
        else fetchProfile(); // Retry to get the trigger-created profile
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const collectIncome = async () => {
    if (!profile || collecting) return;
    setCollecting(true);
    
    try {
      const now = new Date();
      const last = new Date(profile.last_collect);
      const diffHours = Math.min((now - last) / (1000 * 60 * 60), 24); // Max 24 hours
      const income = diffHours * profile.mining_rate;

      if (income <= 0) {
        showToast("No earnings to collect yet. Keep mining!", "info");
        return;
      }

      const { error } = await supabase.from('profiles').update({ 
        balance: profile.balance + income, 
        last_collect: now.toISOString() 
      }).eq('id', user.id);
      
      if (error) throw error;
      
      await fetchProfile();
      showToast(`${income.toFixed(2)} coins collected!`, "success");
    } catch (err) {
      console.error('Error collecting income:', err);
      showToast("Failed to collect income. Try again.", "error");
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-premium-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold neon-text text-premium-gold flex items-center gap-2">
          DiGital InvWOrker
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Premium Mining Dashboard</p>
      </header>

      <div className="premium-card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-zinc-400 text-sm">Account Balance</p>
            <h2 className="text-4xl font-mono font-bold text-white mt-1 flex items-center gap-2">
              {profile?.balance?.toFixed(2)} <Coins className="text-premium-gold size-8" />
            </h2>
          </div>
          <div className="bg-premium-gold/10 p-3 rounded-xl border border-premium-gold/20">
            <TrendingUp className="text-premium-gold" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Mining Rate</p>
            <p className="text-premium-gold font-bold">{profile?.mining_rate}/hr</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Worker Level</p>
            <p className="text-white font-bold">{profile?.worker_level}</p>
          </div>
        </div>
      </div>

      <div className="premium-card mb-6 bg-premium-gold/5 border-premium-gold/20">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-premium-gold" />
          <h3 className="font-bold">Collection Status</h3>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          You earn coins every hour. Collect them before the 24-hour limit is reached!
        </p>
        <button 
          onClick={collectIncome} 
          disabled={collecting}
          className="premium-button w-full flex items-center justify-center gap-2"
        >
          {collecting ? 'Collecting...' : 'Collect My Earnings'}
        </button>
      </div>

      <div className="premium-card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-bold border-b border-zinc-800 pb-2 w-full">My Assets Overview</h3>
        </div>
        {investments.length === 0 ? (
          <p className="text-sm text-zinc-500">You don't have any vehicle assets yet.</p>
        ) : (
          <div className="space-y-3">
            {investments.map(inv => (
              <div key={inv.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-white">{inv.asset_name}</h4>
                  <p className="text-xs text-zinc-500">Hourly: +{inv.hourly_return.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase font-bold">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="premium-card">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="text-premium-gold" />
          <h3 className="font-bold">Referral Program</h3>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          Invite friends and earn bonus coins for every active worker they bring!
        </p>
        <div className="flex gap-2">
          <input 
            readOnly 
            value={`${window.location.origin}/?ref=${user.id}`}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs flex-1 text-zinc-400 font-mono"
          />
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.id}`);
              showToast("Referral link copied!", "success");
            }}
            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
