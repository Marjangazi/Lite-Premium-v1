import { supabase } from '../lib/supabase';
import { ShoppingBag, Zap, Shield, Crown, HardHat } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

const assets = [
  { name: 'Starter Worker', price: 0, rate: 0.1, icon: HardHat, description: 'Basic mining setup for beginners.' },
  { name: 'Digital Worker', price: 5000, rate: 1.0, icon: Zap, description: 'Boost your hourly earnings significantly.' },
  { name: 'Mining Pro', price: 15000, rate: 5.0, icon: Shield, description: 'High-performance industrial mining hardware.' },
  { name: 'Premium Investor', price: 50000, rate: 25.0, icon: Crown, description: 'The ultimate investment for global dominance.' }
];

export default function Shop({ profile, user, onUpdate }) {
  const showToast = useToast();
  const buyAsset = async (asset) => {
    if (!profile) return;
    if (profile.balance < asset.price) return showToast("Not enough coins!", "error");
    
    try {
      const { error } = await supabase.from('profiles').update({ 
        balance: profile.balance - asset.price,
        mining_rate: asset.rate,
        worker_level: asset.name
      }).eq('id', user.id);
      
      if (error) throw error;
      
      showToast(`${asset.name} Purchased!`, "success");
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

      <div className="grid gap-4">
        {assets.map((asset) => {
          const Icon = asset.icon;
          const isOwned = profile?.worker_level === asset.name;
          
          return (
            <div key={asset.name} className={`premium-card flex flex-col gap-4 ${isOwned ? 'border-premium-gold/50 bg-premium-gold/5' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isOwned ? 'bg-premium-gold text-black' : 'bg-zinc-800 text-premium-gold'}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{asset.name}</h3>
                    <p className="text-sm text-zinc-500">{asset.rate}/hr Mining Rate</p>
                  </div>
                </div>
                {isOwned && (
                  <span className="bg-premium-gold/20 text-premium-gold text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-premium-gold/30">
                    Active
                  </span>
                )}
              </div>
              
              <p className="text-zinc-400 text-sm leading-relaxed">
                {asset.description}
              </p>

              <button 
                onClick={() => buyAsset(asset)} 
                disabled={isOwned || profile?.balance < asset.price}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  isOwned 
                    ? 'bg-zinc-800 text-zinc-500 cursor-default' 
                    : 'bg-premium-gold text-black hover:shadow-neon-gold active:scale-[0.98]'
                }`}
              >
                {isOwned ? (
                  'Currently Active'
                ) : (
                  <>
                    Upgrade for {asset.price.toLocaleString()} 🪙
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
