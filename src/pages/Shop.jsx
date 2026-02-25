import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Zap, Shield, Crown, HardHat, TrendingUp, Sparkles, AlertCircle, ShoppingCart, Rocket, Flame, Fingerprint, Activity, Layers } from 'lucide-react';
import { useToast } from '../lib/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const COIN_TO_BDT = 720;
const icons = { HardHat, Zap, Shield, Crown, Rocket, Flame, Activity, Layers };

export default function Shop({ profile, user, onUpdate }) {
  const showToast = useToast();
  const [assets, setAssets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('worker');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAssets(), fetchInvestments()]);
    setLoading(false);
  };

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('price', { ascending: true });
    if (data) setAssets(data);
  };

  const fetchInvestments = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_investments').select('*').eq('user_id', user.id).eq('status', 'active');
    if (data) setInvestments(data);
  };

  const buyAsset = async (asset) => {
    if (!profile) return;
    if (profile.balance < asset.price) return showToast("Insufficient Liquidity!", "error");
    if (asset.units_sold >= asset.stock_limit) return showToast("Market Exhausted!", "error");
    
    try {
      const { error: invError } = await supabase.from('user_investments').insert([{
        user_id: user.id,
        asset_id: asset.id,
        asset_name: asset.name,
        type: asset.type,
        amount: asset.price,
        hourly_return: asset.type === 'worker' ? asset.rate : 0
      }]);
      if (invError) throw invError;
      
      const { error: stockError } = await supabase.from('assets').update({ 
        units_sold: (asset.units_sold || 0) + 1 
      }).eq('id', asset.id);
      if (stockError) throw stockError;

      const { error: balError } = await supabase.from('profiles').update({ 
        balance: profile.balance - asset.price,
        mining_rate: asset.type === 'worker' ? (profile.mining_rate || 0) + asset.rate : profile.mining_rate
      }).eq('id', user.id);
      if (balError) throw balError;
      
      showToast(`${asset.name} Vector Initialized!`, "success");
      fetchData();
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast("Sync Error. Transaction voided.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-premium-gold/10 rounded-[2.5rem] animate-ping absolute" />
          <div className="w-24 h-24 border-[6px] border-premium-gold border-t-transparent rounded-[2rem] animate-spin shadow-neon-gold" />
           <ShoppingCart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-premium-gold animate-bounce" size={24} />
        </div>
        <p className="text-premium-gold font-black tracking-[0.4em] animate-pulse uppercase text-[10px]">Scanning Market Vectors</p>
      </div>
    );
  }

  const filteredAssets = assets.filter(a => a.type === activeCategory);

  return (
    <div className="p-6 max-w-lg mx-auto space-y-12 pb-44">
      <header className="space-y-8">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-premium-gold/10 border-2 border-premium-gold/20 rounded-[2rem] shadow-neon-gold/5">
             <ShoppingBag className="text-premium-gold size-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Market <span className="text-premium-gold">Matrix</span></h1>
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.4em] mt-3 leading-none">Sector Selection Terminal</p>
          </div>
        </div>

        {/* Cyber-Mechanical Category Switcher */}
        <div className="flex bg-zinc-950 border-2 border-zinc-900 p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
           {['worker', 'investor'].map((cat) => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-3 relative z-10 ${activeCategory === cat ? 'bg-premium-gold text-black shadow-neon-gold scale-[1.03]' : 'text-zinc-700 hover:text-zinc-400'}`}
             >
               {cat === 'worker' ? (
                 <><HardHat size={16} /> Workers</>
               ) : (
                 <><Rocket size={16} /> Investors</>
               )}
             </button>
           ))}
        </div>
      </header>

      <div className="space-y-10">
        <AnimatePresence mode="popLayout">
          {filteredAssets.map((asset, index) => {
            const Icon = icons[asset.icon] || Zap;
            const unitsLeft = (asset.stock_limit || 100) - (asset.units_sold || 0);
            const isInvestor = asset.type === 'investor';
            const isSoldOut = unitsLeft <= 0;
            const ownedCount = investments.filter(i => i.asset_name === asset.name).length;
            
            return (
              <motion.div 
                key={asset.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className={`transition-all duration-700 ${isSoldOut ? 'opacity-30 grayscale pointer-events-none' : ''}`}
              >
                <div className={`relative bg-zinc-950 border-2 rounded-[3.5rem] p-10 overflow-hidden group hover:border-premium-gold/30 transition-all duration-700 shadow-3xl ${isInvestor ? 'border-premium-gold/10' : 'border-zinc-900'}`}>
                  {/* Scarcity / Identity Layer */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-premium-gold/20 to-transparent" />
                  
                  <div className="flex justify-between items-center mb-10">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${unitsLeft < 15 ? 'bg-red-500 animate-pulse shadow-neon-red' : 'bg-green-500 shadow-neon-green'}`} />
                           <span className="text-[10px] font-black uppercase text-zinc-700 tracking-widest">{unitsLeft} Vectors Loaded</span>
                        </div>
                        <div className="h-1 w-24 bg-zinc-900 rounded-full overflow-hidden">
                           <div className="h-full bg-premium-gold" style={{ width: `${(unitsLeft/asset.stock_limit)*100}%` }} />
                        </div>
                     </div>
                     <span className={`text-[9px] font-black uppercase px-5 py-2 rounded-full border ${isInvestor ? 'bg-premium-gold/10 text-premium-gold border-premium-gold/20 shadow-neon-gold/5' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>
                        {isInvestor ? 'Capital Yield' : 'Operational ROI'}
                     </span>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-8 relative">
                      <div className={`p-6 rounded-[2.5rem] shadow-inner relative z-10 transition-transform duration-700 group-hover:scale-110 ${isInvestor ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 text-premium-gold border border-zinc-800'}`}>
                        <Icon size={44} className="group-hover:rotate-12 transition-transform" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{asset.name}</h3>
                        <div className="flex items-center gap-3 mt-3">
                           {ownedCount > 0 && <span className="bg-white/5 text-premium-gold text-[9px] font-black px-4 py-1.5 rounded-full border border-premium-gold/10 animate-shimmer">Deployed: {ownedCount}</span>}
                           <span className="text-zinc-700 text-[10px] font-black italic uppercase tracking-widest border-l border-zinc-800 pl-3">Neural Contract</span>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                         <Icon size={120} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-black/80 p-6 rounded-[2rem] border-2 border-zinc-900 shadow-inner group-hover:border-zinc-800 transition-colors">
                        <p className="text-zinc-800 text-[9px] uppercase font-black mb-1 px-1">Acquisition Cost</p>
                        <p className="text-premium-gold font-mono font-black text-2xl tabular-nums italic">{asset.price.toLocaleString()} 🪙</p>
                        <p className="text-[10px] text-zinc-700 font-bold mt-2 tracking-tighter italic border-t border-zinc-900/50 pt-2">৳ {(asset.price / COIN_TO_BDT).toFixed(0)} BDT</p>
                      </div>
                      <div className="bg-black/80 p-6 rounded-[2rem] border-2 border-zinc-900 shadow-inner group-hover:border-zinc-800 transition-colors">
                        <p className={`text-[9px] uppercase font-black mb-1 px-1 ${isInvestor ? 'text-green-500' : 'text-blue-500'}`}>
                          {isInvestor ? 'Monthly Passive' : 'Hourly Net'}
                        </p>
                        <p className="text-white font-mono font-black text-2xl tabular-nums italic">
                          {isInvestor ? `${asset.profit_tier_coins}` : `+${asset.rate}`} <span className="text-[10px] text-zinc-800">C/H</span>
                        </p>
                        <p className={`text-[10px] font-bold mt-2 tracking-tighter italic border-t border-zinc-900/50 pt-2 ${isInvestor ? 'text-green-900' : 'text-blue-900'}`}>Secured Logic</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => buyAsset(asset)}
                      className={`h-24 rounded-[2.5rem] font-black italic uppercase text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 relative overflow-hidden flex items-center justify-center gap-5 border-4 border-black/20 ${
                        isInvestor ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 text-premium-gold border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
                      <Fingerprint size={28} className="animate-pulse opacity-50" />
                      <span className="relative z-10 tracking-widest">Execute Initialization</span>
                      <Sparkles className="relative z-10 group-hover:rotate-45 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="bg-zinc-950 p-10 rounded-[3rem] border-2 border-zinc-900 flex gap-6 items-start shadow-inner relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-6 transition-transform"><Shield size={100} /></div>
         <div className="p-4 bg-premium-gold/5 rounded-2xl text-premium-gold relative z-10">
            <AlertCircle size={28} />
         </div>
         <div className="relative z-10 space-y-2">
            <p className="text-white text-xs font-black uppercase tracking-widest leading-none">Market Integrity Protocol</p>
            <p className="text-[9px] text-zinc-700 font-bold leading-relaxed uppercase tracking-tight">
              Strategic Notice: Capital stability is maintained by strictly limiting market entry vectors. All assets carry a guaranteed 30-day lifecycle with automated liquidations at term. All purchases are final.
            </p>
         </div>
      </div>
    </div>
  );
}
