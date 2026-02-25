import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Withdraw from './pages/Withdraw';
import Deposit from './pages/Deposit';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import { LayoutDashboard, ShoppingCart, Banknote, User, LogOut, ShieldAlert, PlusCircle, MessageSquare, BadgeCheck, Share2 } from 'lucide-react';
import { ToastProvider, useToast } from './lib/ToastContext';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  return (
    <ToastProvider>
      <Router>
        <AppContent 
          session={session} 
          profile={profile} 
          onUpdate={fetchProfile} 
        />
      </Router>
    </ToastProvider>
  );
}

function AppContent({ session, profile, onUpdate }) {
  const [searchParams] = useSearchParams();
  const showToast = useToast();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem('referral_code', ref);
    }
  }, [searchParams]);

  useEffect(() => {
    const processReferral = async () => {
      const refCode = sessionStorage.getItem('referral_code');
      if (session?.user && profile && refCode && !profile.referrer_id && profile.balance === 1000) {
        try {
          const { error } = await supabase.rpc('apply_referral', { 
            new_user_id: session.user.id, 
            referrer_uuid: refCode 
          });
          if (!error) {
            showToast("Referral Matrix Connected!", "success");
            sessionStorage.removeItem('referral_code');
            onUpdate();
          }
        } catch (e) {
          console.error("Referral failed", e);
        }
      }
    };
    processReferral();
  }, [session, profile]);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-premium-dark text-white selection:bg-premium-gold/30">
      <header className="px-6 py-4 flex justify-between items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40 border-b border-zinc-900 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-premium-gold rounded-2xl shadow-neon-gold group transition-all">
            <ShieldAlert size={18} className="text-black group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter text-premium-gold">LITEPREMIUM</h1>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href={`https://wa.me/8801875354842`}
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500/20 transition-all border border-green-500/20"
          >
            <MessageSquare size={16} />
            <span className="text-[10px] font-black uppercase hidden sm:inline">Support</span>
          </a>
        </div>
      </header>

      <main className="pb-40">
        <Routes>
          <Route path="/" element={<Dashboard user={session.user} profile={profile} onUpdate={onUpdate} />} />
          <Route path="/shop" element={<Shop profile={profile} user={session.user} onUpdate={onUpdate} />} />
          <Route path="/deposit" element={<Deposit profile={profile} user={session.user} onUpdate={onUpdate} />} />
          <Route path="/withdraw" element={<Withdraw profile={profile} user={session.user} onUpdate={onUpdate} />} />
          <Route path="/profile" element={<ProfilePage user={session.user} profile={profile} onUpdate={onUpdate} />} />
          <Route path="/admin" element={<Admin user={session.user} />} />
        </Routes>
      </main>
      
      <Navbar user={session.user} profile={profile} />
    </div>
  );
}

function Navbar({ user, profile }) {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dash' },
    { path: '/shop', icon: ShoppingCart, label: 'Shop' },
    { path: '/deposit', icon: PlusCircle, label: 'Cash' },
    { path: '/withdraw', icon: Banknote, label: 'Exit' },
    { path: '/profile', icon: User, label: 'Me' },
  ];

  if (user?.email === 'mdmarzangazi@gmail.com') {
    navItems.push({ path: '/admin', icon: ShieldAlert, label: 'HQ' });
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-zinc-950/80 backdrop-blur-3xl border border-zinc-900 rounded-[2.5rem] p-2 flex justify-around items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-t-zinc-800">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-3xl transition-all duration-500 ${
              isActive 
                ? 'bg-premium-gold text-black scale-105 shadow-neon-gold' 
                : 'text-zinc-600 hover:text-white group'
            }`}
          >
            <Icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ProfilePage({ user, profile, onUpdate }) {
  const handleSignOut = () => supabase.auth.signOut();
  const showToast = useToast();
  const [editing, setEditing] = useState(false);
  const [assetValue, setAssetValue] = useState(0);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    telegram: profile?.telegram || '',
    whatsapp: profile?.whatsapp || '',
    imo: profile?.imo || '',
    bdt_number: profile?.bdt_number || ''
  });

  useEffect(() => {
    const fetchAssetValue = async () => {
      const { data } = await supabase.from('user_investments').select('amount').eq('user_id', user.id).eq('status', 'active');
      if (data) {
        setAssetValue(data.reduce((acc, curr) => acc + (curr.amount || 0), 0));
      }
    };
    fetchAssetValue();
  }, [user]);

  const updateProfile = async () => {
    try {
      const { error } = await supabase.from('profiles').update(formData).eq('id', user.id);
      if (error) throw error;
      showToast("Operational Matrix Updated", "success");
      setEditing(false);
      onUpdate();
    } catch (err) {
      showToast("Sync Error", "error");
    }
  };

  const copyReferral = () => {
    const url = `${window.location.origin}?ref=${user.id}`;
    navigator.clipboard.writeText(url);
    showToast("Referral link encoded to clipboard!", "success");
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8 pb-44">
      <header>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Security <span className="text-premium-gold">Clearance</span></h1>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Verified Operator Profile</p>
      </header>

      <div className="premium-card p-10 space-y-10 relative overflow-hidden group bg-zinc-950 border-zinc-900 shadow-3xl">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
           <User size={200} />
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 ${profile?.badge === 'Platinum' ? 'bg-premium-gold/10 border-premium-gold shadow-neon-gold' : 'bg-zinc-900 border-zinc-800'}`}>
            <User size={44} className={profile?.badge === 'Platinum' ? 'text-premium-gold' : 'text-zinc-700'} />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-3xl uppercase tracking-tighter text-white italic truncate">{profile?.name || user.email.split('@')[0]}</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">{profile?.badge || 'Silver'} OPERATOR</p>
          </div>
        </div>

        {/* Portfolio Stats Group */}
        <div className="grid grid-cols-2 gap-5 relative z-10">
           <div className="bg-black/50 p-6 rounded-3xl border border-zinc-900 shadow-inner">
              <p className="text-[9px] font-black text-zinc-700 uppercase mb-2 tracking-widest text-center">Net Reserves</p>
              <p className="text-xl font-mono font-black text-white text-center tabular-nums">{profile?.balance?.toLocaleString()} <span className="text-[8px] italic">🪙</span></p>
              <p className="text-[8px] font-black text-zinc-800 uppercase mt-2 text-center">≈ ৳ {(profile?.balance / COIN_TO_BDT).toFixed(1)}</p>
           </div>
           <div className="bg-black/50 p-6 rounded-3xl border border-zinc-900 shadow-inner">
              <p className="text-[9px] font-black text-zinc-700 uppercase mb-2 tracking-widest text-center">Asset Value</p>
              <p className="text-xl font-mono font-black text-premium-gold text-center tabular-nums">{assetValue.toLocaleString()} <span className="text-[8px] italic">🪙</span></p>
              <p className="text-[8px] font-black text-premium-gold/40 uppercase mt-2 text-center">≈ ৳ {(assetValue / COIN_TO_BDT).toFixed(1)}</p>
           </div>
        </div>

        <div className="grid gap-4 relative z-10">
          {[
            { label: 'Operator Name', key: 'name', ph: 'Full Name' },
            { label: 'Telegram Identity', key: 'telegram', ph: '@username' },
            { label: 'WhatsApp Vector', key: 'whatsapp', ph: '+880...' },
            { label: 'IMO Protocol', key: 'imo', ph: 'Number or ID' },
            { label: 'Financial Channel (bKash)', key: 'bdt_number', ph: '01XXXXXXXXX' },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
               <label className="text-[9px] font-black uppercase text-zinc-700 tracking-widest ml-2">{field.label}</label>
               <input 
                 type="text"
                 value={formData[field.key]}
                 disabled={!editing}
                 placeholder={field.ph}
                 onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                 className="w-full bg-zinc-900/50 border-2 border-zinc-800 rounded-2xl py-4 px-6 text-white text-xs font-bold outline-none focus:border-premium-gold transition-all disabled:opacity-50 disabled:bg-black/20"
               />
            </div>
          ))}

          {editing ? (
            <button 
              onClick={updateProfile}
              className="mt-4 w-full bg-premium-gold text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-neon-gold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Update Operational Matrix
            </button>
          ) : (
            <button 
              onClick={() => setEditing(true)}
              className="mt-4 w-full bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-zinc-700 hover:bg-zinc-700 transition-all"
            >
              Edit Identity Parameters
            </button>
          )}
        </div>

        <div className="space-y-4 pt-10 border-t border-zinc-900 relative z-10">
           <p className="text-[10px] font-black uppercase text-zinc-700 tracking-widest text-center">Referral Distribution</p>
           <button 
             onClick={copyReferral}
             className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black uppercase text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-premium-gold hover:border-premium-gold/30 transition-all"
           >
             <Share2 size={16} /> Generate Vector Link
           </button>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-6 bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-black transition-all"
        >
          <LogOut size={16} /> Terminate Protocol
        </button>
      </div>
    </div>
  );
}
