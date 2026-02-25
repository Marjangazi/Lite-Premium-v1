import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Coins, TrendingUp, Clock, UserPlus, Sparkles, MessageSquare, BadgeCheck, AlertTriangle, Newspaper, Shield, Trophy, Activity, Rocket, Zap, Fingerprint, Truck, Bus, Hammer, Tractor, Store, ShoppingCart, PlusSquare, Layers, Box } from 'lucide-react';
import { useToast } from '../lib/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const COIN_TO_BDT = 720;
const icons = { Zap, Shield, Activity, Layers, Truck, Bus, Hammer, Tractor, Store, ShoppingBag: ShoppingCart, PlusSquare, Rocket, Box };

export default function Dashboard({ user, profile, onUpdate }) {
  const [investments, setInvestments] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [liveCoins, setLiveCoins] = useState(0);
  const [cycleProgress, setCycleProgress] = useState(0);
  const showToast = useToast();
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchInvestments();
      fetchNews();
      setLoading(false);
    }
    return () => clearInterval(timerRef.current);
  }, [user]);

  useEffect(() => {
    if (profile && investments.length >= 0) {
      clearInterval(timerRef.current);
      const interval = 80;
      
      timerRef.current = setInterval(() => {
        const lastCollect = new Date(profile.last_collect).getTime();
        const now = new Date().getTime();
        const diffMs = now - lastCollect;
        const diffHours = diffMs / (1000 * 60 * 60);

        const progress = Math.min((diffMs / (24 * 60 * 60 * 1000)) * 100, 100);
        setCycleProgress(progress);

        const workerRate = profile.mining_rate || 0;
        const workerYield = Math.min(diffHours, 24) * workerRate;

        let investorRate = 0;
        investments.forEach(inv => {
          if (inv.type === 'investor' && inv.assets?.profit_tier_coins) {
             investorRate += inv.assets.profit_tier_coins / (30 * 24);
          }
        });
        const investorYield = diffHours * investorRate;

        setLiveCoins(workerYield + investorYield);
      }, interval);
    }
    return () => clearInterval(timerRef.current);
  }, [profile, investments]);

  const fetchNews = async () => {
    const { data } = await supabase.from('newsfeed').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setNews(data);
  };

  const fetchInvestments = async () => {
    const { data } = await supabase.from('user_investments').select('*, assets(*)').eq('user_id', user.id).eq('status', 'active');
    if (data) setInvestments(data);
  };

  const collectIncome = async () => {
    if (!profile || collecting) return;
    setCollecting(true);
    
    try {
      const { error } = await supabase.rpc('collect_earnings_expert', { target_user_id: user.id });
      if (error) throw error;
      
      onUpdate();
      setLiveCoins(0);
      showToast("Neural extraction sequence complete. Capital secured.", "success");
    } catch (err) {
      showToast("Verification failed. Retry extraction.", "error");
    } finally {
      setCollecting(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-100 gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-premium-gold/10 rounded-[2rem] animate-ping absolute" />
          <div className="w-24 h-24 border-[6px] border-premium-gold border-t-transparent rounded-[2rem] animate-spin" />
          <Fingerprint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-premium-gold animate-pulse" size={32} />
        </div>
        <div className="text-center space-y-2">
           <p className="text-premium-gold font-black tracking-[0.5em] animate-pulse uppercase text-[10px]">Authorizing Profile</p>
           <p className="text-zinc-800 text-[8px] font-black uppercase">Secure Protocol 2.5.0</p>
        </div>
      </div>
    );
  }

  const workerRate = profile?.mining_rate || 0;
  let investorRate = 0;
  investments.forEach(inv => {
    if (inv.type === 'investor' && inv.assets?.profit_tier_coins) {
       investorRate += inv.assets.profit_tier_coins / (30 * 24);
    }
  });

  return (
    <div className="p-6 max-w-lg mx-auto space-y-12 pb-40">
      {/* High-Definition Ticker */}
      <div className="relative h-14 bg-zinc-950/80 border-y-2 border-zinc-900 flex items-center overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
        <div className="absolute left-0 top-0 bottom-0 px-8 bg-premium-gold text-black flex items-center font-black italic text-[11px] z-20 skew-x-[-20deg] -ml-6 border-r-4 border-black/20">
          <div className="skew-x-[20deg] flex items-center gap-2">
            <Zap size={14} fill="currentColor" /> REALTIME_OS
          </div>
        </div>
        <div className="flex gap-24 animate-marquee whitespace-nowrap pl-32 relative z-10">
          {news.map((n) => (
            <span key={n.id} className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3 group hover:text-white transition-colors cursor-default">
              <Sparkles size={12} className="text-premium-gold group-hover:rotate-45 transition-transform" /> {n.message}
            </span>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent z-20 pointer-events-none" />
      </div>

      {/* Main Liquidity Interface */}
      <div className={`relative p-10 rounded-[3.5rem] bg-zinc-950 border-2 transition-all duration-1000 overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${profile?.badge === 'Platinum' ? 'border-premium-gold/30 shadow-neon-gold/5 animate-glow' : 'border-zinc-900'}`}>
        <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-1000">
           <Shield size={260} className="text-premium-gold" />
        </div>
        
        <div className="relative z-10 space-y-10">
          <div className="flex justify-between items-start">
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                      <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] leading-none">Net Reserves</p>
                   </div>
                   {profile?.badge === 'Platinum' && <BadgeCheck className="text-premium-gold size-4 animate-shimmer" />}
                </div>
                <div className="flex items-baseline gap-4">
                   <h2 className="text-6xl font-black font-mono tracking-tighter text-white tabular-nums">
                     {profile?.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                   </h2>
                   <div className="flex flex-col">
                      <span className="text-premium-gold font-black italic text-xs leading-none">C-UNIT</span>
                      <span className="text-zinc-800 text-[8px] font-black mt-1">v.24.4</span>
                   </div>
                </div>
                <p className="text-zinc-600 font-bold text-[11px] uppercase italic tracking-tight">
                  ≈ ৳ {(profile?.balance / COIN_TO_BDT).toLocaleString()} VALUATION
                </p>
             </div>
          </div>

          <div className="bg-black/80 p-8 rounded-[2.5rem] border-2 border-zinc-900/50 space-y-6 shadow-inner relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
                <Activity size={100} />
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-700 tracking-widest relative z-10">
                <span className="flex items-center gap-3 italic">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Neural Inflow
                </span>
                <span className="text-green-500/50 italic">H-SYNC Active</span>
             </div>
             <div className="relative z-10">
                <p className="text-5xl font-black font-mono text-green-400 tracking-tighter tabular-nums drop-shadow-neon-green">
                  +{liveCoins.toFixed(5)}
                </p>
                
                <button 
                  onClick={collectIncome}
                  disabled={collecting || cycleProgress < 1}
                  className={`mt-6 w-full py-5 rounded-[1.5rem] font-black italic uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 ${collecting ? 'bg-zinc-800 text-zinc-500' : cycleProgress >= 95 ? 'bg-red-500 text-white shadow-neon-red' : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-black shadow-neon-green/10'}`}
                >
                  {collecting ? (
                    <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                       COLLECTING...
                    </div>
                  ) : (
                    <>
                      <PlusSquare size={16} /> Collect Profit
                    </>
                  )}
                </button>
             </div>
             
             <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-800">
                   <span className="flex items-center gap-2"><Clock size={10} /> Sync Window</span>
                   <span className={cycleProgress > 90 ? 'text-red-500' : 'text-zinc-600'}>{cycleProgress.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-zinc-900/50 rounded-full overflow-hidden border border-zinc-900">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${cycleProgress}%` }}
                     className={`h-full transition-all duration-300 ${cycleProgress >= 95 ? 'bg-red-500 shadow-neon-red' : 'bg-gradient-to-r from-premium-gold to-yellow-500'}`}
                   />
                </div>
             </div>
          </div>
          
          {/* List of Active Asset Icons */}
          <div className="space-y-4 pt-4">
             <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-2">Active Deployment Vectors</p>
             <div className="flex flex-wrap gap-3">
                {investments.length === 0 ? (
                  <div className="w-full py-8 border-2 border-dashed border-zinc-900 rounded-3xl flex items-center justify-center grayscale opacity-20">
                     <p className="text-[10px] font-black uppercase">No Active Vectors</p>
                  </div>
                ) : (
                  investments.map((inv, idx) => {
                    const Icon = icons[inv.assets?.icon] || Box;
                    return (
                      <div key={idx} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-inner group hover:border-premium-gold/30 transition-all relative">
                         <Icon size={20} className="text-zinc-600 group-hover:text-premium-gold transition-colors" />
                         <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-neon-green" />
                      </div>
                    )
                  })
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-2 gap-5">
         <div className="bg-zinc-950 p-8 rounded-[2.5rem] border-2 border-zinc-900 flex flex-col items-center text-center gap-4 group hover:border-blue-500/20 transition-all">
            <div className="p-4 bg-blue-500/5 rounded-2xl group-hover:scale-110 transition-transform">
               <Zap className="text-blue-500 size-6" fill="currentColor" />
            </div>
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">Worker Flow</p>
               <p className="text-white font-black font-mono text-xl tracking-tighter">+{workerRate.toFixed(0)} <span className="text-[10px] text-zinc-800 italic">c/h</span></p>
            </div>
         </div>
         <div className="bg-zinc-950 p-8 rounded-[2.5rem] border-2 border-zinc-900 flex flex-col items-center text-center gap-4 group hover:border-premium-gold/20 transition-all">
            <div className="p-4 bg-premium-gold/5 rounded-2xl group-hover:scale-110 transition-transform">
               <Rocket className="text-premium-gold size-6" fill="currentColor" />
            </div>
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">Asset Yield</p>
               <p className="text-white font-black font-mono text-xl tracking-tighter">+{investorRate.toFixed(1)} <span className="text-[10px] text-zinc-800 italic">c/h</span></p>
            </div>
         </div>
      </div>

      {/* Referral Matrix */}
      <div className="bg-zinc-950 p-10 rounded-[3rem] border-2 border-zinc-900 space-y-8 shadow-inner overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-[0.02] -rotate-12"><UserPlus size={120} /></div>
         <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-premium-gold/10 rounded-[1.5rem] border border-premium-gold/20 flex items-center justify-center">
               <UserPlus className="text-premium-gold size-6" />
            </div>
            <div>
               <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Viral <span className="text-premium-gold">Vector</span></h3>
               <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mt-1">Expansion Protocol Active</p>
            </div>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <div className="flex-1 bg-black p-6 rounded-[1.5rem] border border-zinc-900 flex justify-center items-center">
              <p className="text-[10px] text-zinc-600 font-mono font-black italic tracking-tighter truncate w-full">
                {window.location.origin}/?ref={user.id}
              </p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.id}`);
                showToast("Vector link encoded!", "success");
              }}
              className="bg-zinc-900 text-premium-gold px-10 py-6 rounded-[1.5rem] border border-premium-gold/20 font-black text-xs uppercase italic tracking-tighter hover:bg-premium-gold hover:text-black transition-all active:scale-95 shadow-neon-gold/5"
            >
              ENCODE
            </button>
         </div>
         <p className="text-center text-[9px] font-black uppercase text-zinc-800 tracking-[0.4em] pt-4">Network Growth = Capital Dominance</p>
      </div>
    </div>
  );
}
