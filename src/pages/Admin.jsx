import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/ToastContext';
import { Users, Package, Settings, Plus, Edit2, Trash2, CheckCircle, Database, TrendingUp, AlertCircle, Clock, Shield, Search, XCircle, LogOut, Copy, UserPlus, Phone } from 'lucide-react';

export default function Admin({ user }) {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [profiles, setProfiles] = useState([]);
  const [assets, setAssets] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.email === 'mdmarzangazi@gmail.com') {
      refreshAll();
    }
  }, [user]);

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfiles(),
      fetchAssets(),
      fetchDepositRequests(),
      fetchWithdrawRequests(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('admin_settings').select('*').eq('id', 'global').single();
    if (data) setSettings(data);
  };

  const fetchDepositRequests = async () => {
    const { data } = await supabase.from('coin_requests').select('*').order('created_at', { ascending: false });
    if (data) setDepositRequests(data);
  };

  const fetchWithdrawRequests = async () => {
    const { data } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (data) setWithdrawRequests(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data);
  };

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: true });
    if (data) setAssets(data);
  };

  const updateGlobalSettings = async (field, value) => {
    const { error } = await supabase.from('admin_settings').update({ [field]: value }).eq('id', 'global');
    if (!error) {
      showToast("System Parameters Synchronized", "success");
      fetchSettings();
    }
  };

  const handleUserAction = async (profile) => {
    const action = prompt("Tactical Command (balance, badge, status, delete):", "balance");
    if (!action) return;

    if (action === 'balance') {
      const amt = prompt("Balance Adjustment (e.g. +1000 or -500):", "0");
      if (amt) {
        const { error } = await supabase.rpc('increment', { 
          row_id: profile.id, 
          table_name: 'profiles', 
          column_name: 'balance', 
          amount: parseFloat(amt) 
        });
        if (!error) showToast("Neural Balance Updated", "success");
      }
    } else if (action === 'badge') {
      const b = prompt("Badge Class (Silver, Gold, Platinum):", profile.badge);
      if (b) {
        await supabase.from('profiles').update({ badge: b }).eq('id', profile.id);
        showToast("Authority Level Reclassified", "success");
      }
    } else if (action === 'status') {
      const s = prompt("Operational Status (active, banned):", profile.status);
      if (s) {
        await supabase.from('profiles').update({ status: s }).eq('id', profile.id);
        showToast("User Access Vector Modified", "success");
      }
    } else if (action === 'delete') {
      if (confirm("Terminate user record?")) {
        await supabase.from('profiles').delete().eq('id', profile.id);
        showToast("Record Purged", "warning");
      }
    }
    refreshAll();
  };

  const handleAssetAction = async (asset = null) => {
    const isEdit = !!asset;
    const name = prompt("Asset Designation (Name):", isEdit ? asset.name : "");
    if (!name) return;
    
    const type = prompt("Vector Classification ('worker' or 'investor'):", isEdit ? asset.type : "worker");
    const price = prompt("Deployment Cost (Internal Coins):", isEdit ? asset.price : "1000");
    const stock_limit = prompt("Global Emission Limit (Stock):", isEdit ? asset.stock_limit : "100");
    const lifecycle = prompt("Operational Lifecycle (Days):", isEdit ? asset.lifecycle_days : "30");
    
    let rate = 0;
    let profit_tier = 0;

    if (type === 'worker') {
      rate = prompt("Active Generation Velocity (Coins/Hour):", isEdit ? asset.rate : "10");
    } else {
      profit_tier = prompt("Strategic Profit Target (Monthly Total Coins):", isEdit ? asset.profit_tier_coins : "5000");
    }

    const payload = {
      name,
      type,
      price: parseFloat(price),
      stock_limit: parseInt(stock_limit),
      lifecycle_days: parseInt(lifecycle),
      rate: parseFloat(rate || 0),
      profit_tier_coins: parseFloat(profit_tier || 0),
      icon: type === 'worker' ? 'Zap' : 'Rocket'
    };

    const { error } = isEdit 
      ? await supabase.from('assets').update(payload).eq('id', asset.id)
      : await supabase.from('assets').insert([payload]);

    if (!error) {
       showToast(isEdit ? "Asset configuration synchronized!" : "New asset vector deployed!", "success");
       fetchAssets();
    }
  };

  const approveDeposit = async (req) => {
    const { error } = await supabase.rpc('approve_coin_request', { req_id: req.id });
    if (!error) {
      showToast("Deposit Captured & Verified", "success");
      refreshAll();
    }
  };

  if (user?.email !== 'mdmarzangazi@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="premium-card text-center max-w-sm space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
             <AlertCircle className="text-red-500 size-10" />
          </div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Access Denied</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase leading-relaxed">Security clearance level insufficient. Protocol 403 active.</p>
        </div>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto pb-40 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-premium-gold/10 rounded-2xl border border-premium-gold/20">
                 <Shield className="text-premium-gold size-6" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Command <span className="text-premium-gold">Center</span></h1>
           </div>
           <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] ml-[68px]">Strategic Oversight Protocol</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex items-center gap-6 shadow-2xl">
           <div className="text-right border-r border-zinc-800 pr-6">
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Global Liquidity</p>
              <p className="text-2xl font-mono text-premium-gold font-black">{profiles.reduce((a,c) => a+(c.balance||0), 0).toLocaleString()} <span className="text-[10px] italic">🪙</span></p>
           </div>
           <button onClick={refreshAll} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all text-zinc-400">
             <Clock size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </header>

      <nav className="flex bg-zinc-900 border-2 border-zinc-800 p-2 rounded-[2.5rem] sticky top-4 z-50 backdrop-blur-3xl shadow-3xl">
        {[
          { id: 'users', icon: Users, label: 'Profiles' },
          { id: 'deposits', icon: Plus, label: 'Capital' },
          { id: 'withdrawals', icon: TrendingUp, label: 'Outflow' },
          { id: 'assets', icon: Package, label: 'Assets' },
          { id: 'settings', icon: Settings, label: 'Config' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-500 flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-premium-gold text-black shadow-neon-gold scale-[1.05]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
          >
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-premium-gold transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Query Identity Database (Email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] py-6 pl-16 pr-8 text-white font-bold placeholder:text-zinc-700 focus:border-premium-gold/50 focus:outline-none focus:shadow-neon-gold/10 transition-all text-sm"
            />
          </div>

          <div className="grid gap-4">
            {filteredProfiles.map(p => (
              <div key={p.id} className={`premium-card p-6 flex flex-col sm:flex-row justify-between items-center gap-6 group hover:border-premium-gold/30 transition-all ${p.status === 'banned' ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-center gap-5 w-full">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-2 transition-all duration-500 ${p.badge === 'Platinum' ? 'bg-premium-gold/10 text-premium-gold border-premium-gold/40 shadow-neon-gold' : 'bg-zinc-900 text-zinc-700 border-zinc-800'}`}>
                     {p.email[0].toUpperCase()}
                   </div>
                   <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-zinc-100 uppercase tracking-tight">{p.email}</p>
                        {p.status === 'banned' && <XCircle size={14} className="text-red-500" />}
                        {p.badge === 'Platinum' && <CheckCircle size={14} className="text-premium-gold" />}
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">{p.badge} Tier</span>
                         <span className="text-[9px] font-black uppercase text-zinc-800">•</span>
                         <span className="text-[9px] font-black uppercase text-zinc-600">Refs: {p.referral_count || 0}</span>
                      </div>
                   </div>
                   <div className="text-right hidden sm:block pr-6 border-r border-zinc-800">
                      <p className="text-[8px] font-black uppercase text-zinc-700 mb-1">Portfolio</p>
                      <p className="font-mono font-black text-premium-gold">{(p.balance || 0).toLocaleString()} 🪙</p>
                   </div>
                </div>
                <button onClick={() => handleUserAction(p)} className="p-4 bg-zinc-800 hover:bg-premium-gold hover:text-black rounded-2xl transition-all border border-zinc-700 active:scale-90"><Edit2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="grid gap-4">
           {depositRequests.length === 0 ? <EmptyState msg="No capital flow detected" /> : 
            depositRequests.map(req => (
              <div key={req.id} className="premium-card p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] rotate-12"><LogOut size={160} /></div>
                <div className="flex gap-6 items-center w-full relative z-10">
                  <div className={`p-5 rounded-3xl ${req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-premium-gold/10 text-premium-gold shadow-inner'}`}>
                     <Plus size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black italic text-zinc-100 uppercase leading-none">{req.email}</h3>
                    <div className="flex flex-wrap gap-2">
                       <span className="text-[9px] font-black bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg uppercase border border-zinc-700/50">{req.method}</span>
                       <span className="text-[9px] font-black bg-premium-gold/20 text-premium-gold px-3 py-1 rounded-lg uppercase border border-premium-gold/20 tracking-widest">{req.transaction_id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto relative z-10">
                   <div className="text-right min-w-[140px]">
                      <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Target Capital</p>
                      <p className="text-2xl font-mono font-black text-premium-gold">+{req.coins_to_add?.toLocaleString()} 🪙</p>
                      <p className="text-[10px] font-bold text-zinc-500 italic">৳ {req.amount_bdt}</p>
                   </div>
                   {req.status === 'pending' && (
                     <button 
                        onClick={() => approveDeposit(req)}
                        className="h-16 bg-green-500 text-black px-8 rounded-[1.5rem] font-black italic uppercase tracking-tighter hover:scale-105 hover:shadow-neon-green transition-all"
                     >AUTHENTICATE</button>
                   )}
                </div>
              </div>
            ))
           }
        </div>
      )}

      {activeTab === 'withdrawals' && (
         <div className="grid gap-4">
           {withdrawRequests.length === 0 ? <EmptyState msg="No liquidity exit requests" /> : 
            withdrawRequests.map(req => (
              <div key={req.id} className="premium-card p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative group">
                <div className="flex gap-6 items-center w-full">
                  <div className={`p-5 rounded-3xl ${req.status === 'pending' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-900 text-zinc-700'}`}>
                     <LogOut size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black italic text-white uppercase">{req.email}</h3>
                    <p className="text-[10px] font-black text-premium-gold uppercase tracking-widest">{req.method} • {req.number}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase italic">{new Date(req.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto">
                   <div className="text-right min-w-[140px]">
                      <p className="text-[9px] font-black uppercase text-zinc-700 mb-1">Exiting Volume</p>
                      <p className="text-2xl font-mono font-black text-red-500">-{req.amount_coins?.toLocaleString()} 🪙</p>
                      <p className="text-[10px] font-bold text-zinc-500">৳ {req.amount_bdt?.toFixed(2)}</p>
                   </div>
                   {req.status === 'pending' ? (
                     <div className="flex gap-3">
                        <button 
                          onClick={async () => {
                            await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', req.id);
                            showToast("Capital Liquidated", "success");
                            refreshAll();
                          }}
                          className="h-16 bg-white text-black px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                        >APPROVE</button>
                        <button 
                          onClick={async () => {
                            const { data: userData } = await supabase.from('profiles').select('balance').eq('id', req.user_id).single();
                            await supabase.from('profiles').update({ balance: (userData?.balance || 0) + req.amount_coins }).eq('id', req.user_id);
                            await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', req.id);
                            showToast("Request Returned", "info");
                            refreshAll();
                          }}
                          className="h-16 bg-zinc-800 text-red-500 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-500/20 active:scale-95 transition-all"
                        >VOID</button>
                     </div>
                   ) : (
                     <div className={`px-6 py-3 rounded-2xl border ${req.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} text-[10px] font-black uppercase tracking-widest`}>
                        {req.status}
                     </div>
                   )}
                </div>
              </div>
            ))
           }
         </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-8">
          <button 
            onClick={() => handleAssetAction()}
            className="w-full bg-premium-gold text-black py-6 rounded-[2.5rem] font-black italic tracking-tighter uppercase text-2xl shadow-neon-gold hover:scale-[1.01] transition-all flex items-center justify-center gap-4 group"
          >
            <Database className="group-hover:rotate-12 transition-transform" /> 
            Deploy New Asset Class
          </button>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assets.map(a => (
              <div key={a.id} className="relative bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 hover:border-premium-gold/40 transition-all duration-700 group overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                   <TrendingUp size={160} />
                </div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`p-5 rounded-3xl ${a.type === 'worker' ? 'bg-blue-500/10 text-blue-400' : 'bg-premium-gold/10 text-premium-gold shadow-inner border border-premium-gold/20'}`}>
                    {a.type === 'worker' ? <Package size={32} /> : <Rocket size={32} />}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAssetAction(a)} className="p-3 bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all"><Edit2 size={18} /></button>
                    <button onClick={async () => {
                       if(confirm("Expunge terminal vector?")) {
                         await supabase.from('assets').delete().eq('id', a.id);
                         fetchAssets();
                       }
                    }} className="p-3 bg-red-500/5 text-zinc-500 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
                
                <div className="mb-8 relative z-10">
                   <h3 className="text-2xl font-black text-zinc-100 italic uppercase tracking-tighter leading-tight">{a.name}</h3>
                   <div className="flex items-center gap-3 mt-3">
                     <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${a.type === 'investor' ? 'bg-premium-gold text-black' : 'bg-zinc-800 text-zinc-600'}`}>{a.type} Vector</span>
                     <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest leading-none">ID-{a.id.slice(0, 4)}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="bg-black/40 rounded-3xl p-5 border border-zinc-800/80">
                      <p className="text-[9px] font-black text-zinc-700 uppercase mb-1">Cap Evaluation</p>
                      <p className="font-mono font-black text-premium-gold text-lg">{a.price?.toLocaleString()} 🪙</p>
                   </div>
                   <div className="bg-black/40 rounded-3xl p-5 border border-zinc-800/80">
                      <p className="text-[9px] font-black text-zinc-700 uppercase mb-1">{a.type === 'worker' ? 'Net Hourly' : 'Monthly Goal'}</p>
                      <p className="font-mono font-black text-zinc-200 text-lg">{a.type === 'worker' ? `+${a.rate}` : a.profit_tier_coins}</p>
                   </div>
                   <div className="bg-black/40 rounded-3xl p-6 border border-zinc-800/80 col-span-2">
                      <div className="flex justify-between items-center mb-2">
                         <p className="text-[9px] font-black text-zinc-700 uppercase">Vector Density</p>
                         <p className="text-[10px] font-mono font-black text-zinc-500">{a.units_sold} / {a.stock_limit}</p>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(a.units_sold/a.stock_limit)*100}%` }}
                          className="h-full bg-premium-gold shadow-neon-gold" 
                        />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-8">
           <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] p-10 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-premium-gold/50 to-transparent" />
              
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-premium-gold/10 rounded-2xl"><Phone className="text-premium-gold size-6" /></div>
                    <h3 className="text-xl font-black italic uppercase text-white">Financial Endpoints</h3>
                 </div>
                 <div className="grid gap-4">
                    <div className="bg-black/50 p-6 rounded-3xl border border-zinc-800/50 flex justify-between items-center group">
                       <div>
                          <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Official Cash-In Number</p>
                          <p className="text-lg font-black text-white italic tracking-tighter">{settings?.cashout_number || '+8801234567890'}</p>
                       </div>
                       <button onClick={() => {
                          const n = prompt("Update official Cash-in terminal number:", settings?.cashout_number);
                          if(n) updateGlobalSettings('cashout_number', n);
                       }} className="p-4 bg-zinc-800 hover:bg-premium-gold hover:text-black rounded-2xl transition-all"><Edit2 size={20} /></button>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-2xl"><LogOut className="text-red-500 size-6" /></div>
                    <h3 className="text-xl font-black italic uppercase text-white">Exit Protocols</h3>
                 </div>
                 <div className="grid gap-4">
                    <div className="bg-black/50 p-6 rounded-3xl border border-zinc-800/50 flex justify-between items-center group">
                       <div>
                          <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Minimum Withdrawal Limit</p>
                          <p className="text-lg font-black text-white italic tracking-tighter">{settings?.min_withdraw || 7200} <span className="text-[10px] opacity-40">COINS</span></p>
                       </div>
                       <button onClick={() => {
                          const amt = prompt("Update global minimum withdrawal (Coins):", settings?.min_withdraw);
                          if(amt) updateGlobalSettings('min_withdraw', parseFloat(amt));
                       }} className="p-4 bg-zinc-800 hover:bg-premium-gold hover:text-black rounded-2xl transition-all"><Edit2 size={20} /></button>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-premium-gold/10 rounded-2xl"><UserPlus className="text-premium-gold size-6" /></div>
                    <h3 className="text-xl font-black italic uppercase text-white">Growth Logic</h3>
                 </div>
                 <div className="grid gap-4">
                    <div className="bg-black/50 p-6 rounded-3xl border border-zinc-800/50 flex justify-between items-center group">
                       <div>
                          <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Signup Referral Reward</p>
                          <p className="text-lg font-black text-white italic tracking-tighter">{settings?.referral_bonus || 720} <span className="text-[10px] opacity-40">COINS</span></p>
                       </div>
                       <button onClick={() => {
                          const amt = prompt("Update global signup reward:", settings?.referral_bonus);
                          if(amt) updateGlobalSettings('referral_bonus', parseFloat(amt));
                       }} className="p-4 bg-zinc-800 hover:bg-premium-gold hover:text-black rounded-2xl transition-all"><Edit2 size={20} /></button>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex justify-center">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Operational Core v2.0</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[3rem] py-32 text-center">
       <div className="bg-zinc-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Database className="text-zinc-600 size-10" />
       </div>
       <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em]">{msg}</p>
    </div>
  );
}
