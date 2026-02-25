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
      if (asset.type === 'worker') {
        const { error } = await supabase.from('profiles').update({ 
          balance: profile.balance - asset.price,
          mining_rate: asset.rate,
          worker_level: asset.name
        }).eq('id', user.id);
        if (error) throw error;
      } else if (asset.type === 'vehicle') {
        // Calculate hourly return based on monthly profit
        // Example: (1000 * 5%) = 50 coins / month = 50 / 720 hours = 0.069 per hour
        const profitTotal = asset.price * (asset.profit_percent / 100);
        const hourly = profitTotal / (30 * 24);

        const { error: invError } = await supabase.from('user_investments').insert([{
          user_id: user.id,
          asset_name: asset.name,
          amount: asset.price,
          profit_percent: asset.profit_percent,
          hourly_return: hourly
        }]);
        if (invError) throw invError;
        
        const { error: balError } = await supabase.from('profiles').update({ 
          balance: profile.balance - asset.price,
          mining_rate: profile.mining_rate + hourly
        }).eq('id', user.id);
        if (balError) throw balError;
      }
      
      showToast(`${asset.name} Purchased!`, "success");
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
            let isOwned = false;
            let countOwned = 0;

            if (asset.type === 'worker') {
              isOwned = profile?.worker_level === asset.name;
            } else {
              countOwned = investments.filter(i => i.asset_name === asset.name).length;
              isOwned = false;
            }
            
            return (
              <motion.div 
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
                className={`premium-card flex flex-col gap-4 relative overflow-hidden ${isOwned ? 'border-premium-gold/50 bg-premium-gold/5' : ''}`}
              >
                {isOwned && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-8 -top-8 bg-premium-gold p-12 rotate-45"
                  />
                )}
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-3 rounded-2xl ${isOwned || countOwned > 0 ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-800 text-premium-gold'}`}
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
                  {isOwned && (
                    <span className="bg-premium-gold/20 text-premium-gold text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-premium-gold/30 backdrop-blur-md">
                      Equipped
                    </span>
                  )}
                  {countOwned > 0 && asset.type === 'vehicle' && (
                    <span className="bg-green-500/20 text-green-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-green-500/30 backdrop-blur-md">
                      Count: {countOwned}
                    </span>
                  )}
                </div>

                <motion.button 
                  whileHover={!isOwned && profile?.balance >= asset.price ? { scale: 1.02 } : {}}
                  whileTap={!isOwned && profile?.balance >= asset.price ? { scale: 0.98 } : {}}
                  onClick={() => buyAsset(asset)} 
                  disabled={isOwned || profile?.balance < asset.price}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 relative z-10 ${
                    isOwned 
                      ? 'bg-zinc-800 text-zinc-500 cursor-default border border-zinc-700' 
                      : 'bg-premium-gold text-black shadow-neon-gold hover:shadow-neon-gold-lg'
                  }`}
                >
                  {isOwned ? (
                    'Active Asset'
                  ) : (
                    <>
                      {asset.type === 'worker' ? 'Hire Worker' : 'Buy Asset'} — {asset.price.toLocaleString()} 🪙
                    </>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
