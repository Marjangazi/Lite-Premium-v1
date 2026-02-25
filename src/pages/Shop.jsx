import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Zap, Shield, Crown, HardHat, Truck, Car, CarFront, Sparkles } from 'lucide-react';
import { useToast } from '../lib/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const icons = {
  HardHat, Zap, Shield, Crown, Truck, Car, CarFront
};

export default function Shop({ profile, user, onUpdate }) {
  const showToast = useToast();
  const [assets, setAssets] = useState([]);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    fetchAssets();
    fetchInvestments();
  }, [user]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('price', { ascending: true });
    if (data) setAssets(data);
  };

  const fetchInvestments = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_investments').select('*').eq('user_id', user.id);
    if (data) setInvestments(data);
  };

  const buyAsset = async (asset) => {
    if (!profile) return;
    if (profile.balance < asset.price) return showToast("Not enough coins!", "error");
    
    try {
      // Logic for BOTH workers and vehicles: ADD to mining rate
      let hourlyChange = 0;
      
      if (asset.type === 'worker') {
        hourlyChange = asset.rate;
      } else {
        // Calculate hourly return for vehicles
        const profitTotal = asset.price * (asset.profit_percent / 100);
        hourlyChange = profitTotal / (30 * 24);
      }

      // 1. Log the purchase in user_investments for history
      const { error: invError } = await supabase.from('user_investments').insert([{
        user_id: user.id,
        asset_name: asset.name,
        amount: asset.price,
        profit_percent: asset.profit_percent || 0,
        hourly_return: hourlyChange
      }]);
      if (invError) throw invError;
      
      // 2. Update user profile: Deduct balance and ADD to mining_rate
      const { error: balError } = await supabase.from('profiles').update({ 
        balance: profile.balance - asset.price,
        mining_rate: profile.mining_rate + hourlyChange,
        worker_level: asset.type === 'worker' ? asset.name : profile.worker_level // Keep latest worker name as level
      }).eq('id', user.id);
      
      if (balError) throw balError;
      
      showToast(`${asset.name} Purchased! Rate increased by +${hourlyChange.toFixed(2)}`, "success");
      fetchInvestments();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error buying asset:', err);
      showToast("Purchase failed. Please try again.", "error");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold neon-text text-premium-gold flex items-center gap-2">
          Asset Shop <ShoppingBag className="size-8" />
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Upgrade your mining capability</p>
      </header>

      <motion.div 
        layout
        className="grid gap-4"
      >
        <AnimatePresence mode="popLayout">
          {assets.map((asset, index) => {
            const Icon = icons[asset.icon] || Zap;
            const countOwned = investments.filter(i => i.asset_name === asset.name).length;
            const canAfford = profile?.balance >= asset.price;
            
            return (
              <motion.div 
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
                className={`premium-card flex flex-col gap-4 relative overflow-hidden ${countOwned > 0 ? 'border-premium-gold/30' : ''}`}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-3 rounded-2xl ${countOwned > 0 ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-800 text-premium-gold'}`}
                    >
                      <Icon size={24} />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg">{asset.name}</h3>
                      {asset.type === 'worker' ? (
                         <p className="text-sm text-zinc-500 font-mono">+{asset.rate}/hr Mining</p>
                      ) : (
                         <p className="text-sm text-green-400 font-mono">+{asset.profit_percent}% Profit</p>
                      )}
                    </div>
                  </div>
                  {countOwned > 0 && (
                    <span className="bg-premium-gold/20 text-premium-gold text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-premium-gold/30 backdrop-blur-md">
                      Owned: {countOwned}
                    </span>
                  )}
                </div>

                <motion.button 
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                  whileTap={canAfford ? { scale: 0.98 } : {}}
                  onClick={() => buyAsset(asset)} 
                  disabled={!canAfford}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 relative z-10 ${
                    !canAfford 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                      : 'bg-premium-gold text-black shadow-neon-gold hover:shadow-neon-gold-lg'
                  }`}
                >
                  {asset.type === 'worker' ? 'Hire' : 'Buy'} — {asset.price.toLocaleString()} 🪙
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
