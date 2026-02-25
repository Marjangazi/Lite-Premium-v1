import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/ToastContext';
import { Users, Package, Settings, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';

export default function Admin({ user }) {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [profiles, setProfiles] = useState([]);
  const [assets, setAssets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  
  // Modals state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email === 'mdmarzangazi@gmail.com') {
      fetchProfiles();
      fetchAssets();
      fetchInvestments();
      fetchDepositRequests();
      fetchWithdrawRequests();
    }
  }, [user]);

  const fetchDepositRequests = async () => {
    const { data } = await supabase.from('coin_requests').select('*').order('created_at', { ascending: false });
    if (data) setDepositRequests(data);
  };

  const fetchWithdrawRequests = async () => {
    const { data } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (data) setWithdrawRequests(data);
  };

  const fetchInvestments = async () => {
    const { data } = await supabase.from('user_investments').select('*');
    if (data) setInvestments(data);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error) setProfiles(data);
  };

  const fetchAssets = async () => {
    const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: true });
    if (!error) setAssets(data);
  };

  const updateUserBalance = async (targetId, currentBalance, type) => {
    const adminProfile = profiles.find(p => p.email === 'mdmarzangazi@gmail.com');
    if (!adminProfile) return;

    const amountStr = prompt(`Enter coins to ${type}:`);
    const amount = parseFloat(amountStr);
    
    if (amount && !isNaN(amount) && amount > 0) {
      if (type === 'give' && adminProfile.balance < amount) {
        return showToast("Admin does not have enough balance!", "error");
      }
      if (type === 'take' && currentBalance < amount) {
        return showToast("User does not have enough balance!", "error");
      }

      const newTargetBal = type === 'give' ? currentBalance + amount : currentBalance - amount;
      const newAdminBal = type === 'give' ? adminProfile.balance - amount : adminProfile.balance + amount;

      // Update User
      await supabase.from('profiles').update({ balance: newTargetBal }).eq('id', targetId);
      // Update Admin
      await supabase.from('profiles').update({ balance: newAdminBal }).eq('email', 'mdmarzangazi@gmail.com');

      showToast(`Successfully ${type}n coins!`, "success");
      fetchProfiles();
    }
  };

  const addAsset = async () => {
    const promptName = prompt("Asset Name:");
    if (!promptName) return;
    const promptType = prompt("Type ('worker' or 'vehicle'):", "vehicle");
    const promptPrice = prompt("Price (Coins):");
    const promptRate = promptType === 'worker' ? prompt("Hourly Mining Rate:", "0") : 0;
    const promptProfit = promptType === 'vehicle' ? prompt("Monthly Profit %:", "5") : 0;

    const { error } = await supabase.from('assets').insert([{
      name: promptName,
      type: promptType || 'worker',
      price: parseFloat(promptPrice || 0),
      rate: parseFloat(promptRate || 0),
      profit_percent: parseFloat(promptProfit || 0)
    }]);

    if (!error) {
      showToast("Asset added!", "success");
      fetchAssets();
    } else {
      showToast(error.message, "error");
    }
  };

  const editAsset = async (asset) => {
    const promptPrice = prompt(`Update price for ${asset.name}:`, asset.price);
    if (!promptPrice) return;
    const promptProfit = asset.type === 'vehicle' ? prompt("Update monthly profit %:", asset.profit_percent) : 0;
    const promptRate = asset.type === 'worker' ? prompt("Update hourly rate:", asset.rate) : 0;

    const { error } = await supabase.from('assets').update({
      price: parseFloat(promptPrice),
      profit_percent: parseFloat(promptProfit),
      rate: parseFloat(promptRate)
    }).eq('id', asset.id);

    if (!error) {
      showToast("Asset updated!", "success");
      fetchAssets();
    } else {
      showToast(error.message, "error");
    }
  };

  const deleteAsset = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (!error) {
        showToast("Asset deleted", "success");
        fetchAssets();
      } else {
        showToast(error.message, "error");
      }
    }
  };

  if (user.email !== 'mdmarzangazi@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="premium-card text-center space-y-4">
          <Settings className="text-red-500 size-12 mx-auto" />
          <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
          <p className="text-zinc-400">You must be an administrator to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold neon-text text-premium-gold flex items-center gap-2">
            Control Panel <Settings className="size-8" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Super Admin Dashboard</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
        >
          <Users size={16} /> Users
        </button>
        <button 
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'deposits' ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
        >
          <Plus size={16} /> Deposits
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'withdrawals' ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
        >
          <Settings size={16} /> Withdrawals
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'assets' ? 'bg-premium-gold text-black shadow-neon-gold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
        >
          <Package size={16} /> Shop
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="premium-card mb-4 border-premium-gold/50">
            <h2 className="text-xl font-bold flex items-center gap-2">Admin Bank <CheckCircle className="text-premium-gold" /></h2>
            <p className="text-sm text-zinc-400">Total coins available to distribute</p>
            <div className="flex items-center gap-4 mt-2">
              <h3 className="text-3xl font-mono text-premium-gold">
                {profiles.find(p => p.email === 'mdmarzangazi@gmail.com')?.balance?.toFixed(2) || 0} 🪙
              </h3>
              <button 
                onClick={() => {
                  const adminProfile = profiles.find(p => p.email === 'mdmarzangazi@gmail.com');
                  if (!adminProfile) return;
                  const amt = prompt("How many coins do you want to mint/add to the Admin Bank?");
                  if (amt && !isNaN(amt)) {
                    supabase.from('profiles').update({ balance: adminProfile.balance + parseFloat(amt) }).eq('email', 'mdmarzangazi@gmail.com')
                      .then(() => fetchProfiles());
                  }
                }}
                className="bg-zinc-800 text-xs px-3 py-2 rounded font-bold hover:bg-zinc-700 transition"
              >
                + Mint Coins
              </button>
            </div>
          </div>

          {profiles.map(p => {
            const userInvs = investments.filter(inv => inv.user_id === p.id);
            return (
              <div key={p.id} className="premium-card flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{p.email}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
                        {p.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">ID: {p.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Balance</p>
                      <p className="text-premium-gold font-mono font-bold text-lg">{p.balance?.toFixed(2)} 🪙</p>
                    </div>
                    {p.email !== 'mdmarzangazi@gmail.com' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateUserBalance(p.id, p.balance, 'give')} className="bg-green-500/20 text-green-400 px-3 py-1 text-xs font-bold rounded-lg hover:bg-green-500/30 transition-colors">
                          Give
                        </button>
                        <button onClick={() => updateUserBalance(p.id, p.balance, 'take')} className="bg-red-500/20 text-red-400 px-3 py-1 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors">
                          Take
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {userInvs.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">Assets Owned:</p>
                    <div className="flex flex-wrap gap-2">
                      {userInvs.map(inv => (
                        <span key={inv.id} className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded text-zinc-300">
                          {inv.asset_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-premium-gold">Deposit Requests</h2>
          {depositRequests.length === 0 ? <p className="text-zinc-500">No requests.</p> : 
            depositRequests.map(req => (
              <div key={req.id} className="premium-card flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.email}</p>
                  <p className="text-lg text-premium-gold font-mono">{req.amount} 🪙</p>
                  <p className="text-xs text-zinc-500">{req.method} | {req.transaction_id}</p>
                </div>
                {req.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        await supabase.rpc('approve_coin_request', { req_id: req.id });
                        showToast("Request Approved!", "success");
                        fetchDepositRequests();
                        fetchProfiles();
                      }}
                      className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-400 transition"
                    >Approve</button>
                    <button 
                      onClick={async () => {
                        await supabase.from('coin_requests').update({ status: 'rejected' }).eq('id', req.id);
                        showToast("Request Rejected", "info");
                        fetchDepositRequests();
                      }}
                      className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-500/30 transition"
                    >Reject</button>
                  </div>
                ) : (
                  <span className={`text-xs font-bold uppercase ${req.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{req.status}</span>
                )}
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-red-400">Withdrawal Requests</h2>
          {withdrawRequests.length === 0 ? <p className="text-zinc-500">No requests.</p> : 
            withdrawRequests.map(req => (
              <div key={req.id} className="premium-card flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.email || 'User'}</p>
                  <p className="text-lg text-red-400 font-mono">-{req.amount} 🪙</p>
                  <p className="text-xs text-zinc-500">{req.method} | {req.address || req.number}</p>
                </div>
                {req.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', req.id);
                        showToast("Withdrawal Marked as Paid", "success");
                        fetchWithdrawRequests();
                      }}
                      className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-400 transition"
                    >Paid</button>
                    <button 
                      onClick={async () => {
                        const { data: userData } = await supabase.from('profiles').select('balance').eq('id', req.user_id).single();
                        await supabase.from('profiles').update({ balance: (userData?.balance || 0) + req.amount }).eq('id', req.user_id);
                        await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', req.id);
                        showToast("Rejected & Refunded", "info");
                        fetchWithdrawRequests();
                        fetchProfiles();
                      }}
                      className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-500/30 transition"
                    >Reject/Refund</button>
                  </div>
                ) : (
                  <span className={`text-xs font-bold uppercase ${req.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{req.status}</span>
                )}
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-6">
          <button onClick={addAsset} className="premium-button flex items-center justify-center gap-2 w-full max-w-xs">
            <Plus size={18} /> Create New Asset
          </button>
          
          <div className="grid md:grid-cols-2 gap-4">
            {assets.map(a => (
              <div key={a.id} className="premium-card flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-bold text-lg">{a.name}</h3>
                    <span className="bg-zinc-800/50 text-[10px] uppercase px-2 py-1 rounded text-zinc-400">{a.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editAsset(a)} className="text-blue-400 hover:scale-110 transition-transform"><Edit2 size={18} /></button>
                    <button onClick={() => deleteAsset(a.id)} className="text-red-400 hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Price</p>
                    <p className="font-bold text-premium-gold">{a.price.toLocaleString()} 🪙</p>
                  </div>
                  {a.type === 'worker' ? (
                    <div>
                      <p className="text-zinc-500 text-xs">Hourly Rate</p>
                      <p className="font-bold">{a.rate}/hr</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-zinc-500 text-xs">Monthly Profit</p>
                      <p className="font-bold text-green-400">{a.profit_percent}% / month</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
