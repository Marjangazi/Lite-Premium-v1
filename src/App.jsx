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
          <h1 className="text-xl font-black italic tracking-tighter text-premium-gold">PARTIMER <span className="text-white not-italic">OFFICIAL</span></h1>
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

  const copyReferral = () => {
    const url = `${window.location.origin}?ref=${user.id}`;
    navigator.clipboard.writeText(url);
    showToast("Referral link encoded to clipboard!", "success");
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Security <span className="text-premium-gold">Clearance</span></h1>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Verified Operator Profile</p>
      </header>

      <div className="premium-card p-8 space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
           <User size={160} />
        </div>

        {profile?.badge === 'Platinum' && (
          <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-1.5 bg-premium-gold text-black text-[10px] font-black uppercase rounded-full shadow-neon-gold animate-shimmer">
            <BadgeCheck size={14} /> VIP Platinum
          </div>
        )}
        
        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 ${profile?.badge === 'Platinum' ? 'bg-premium-gold/10 border-premium-gold shadow-neon-gold' : 'bg-zinc-900 border-zinc-800'}`}>
            <User size={40} className={profile?.badge === 'Platinum' ? 'text-premium-gold' : 'text-zinc-700'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-2xl uppercase tracking-tighter text-white italic">{user.email.split('@')[0]}</h2>
            </div>
            <p className="text-zinc-500 text-xs font-bold">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-black/40 p-5 rounded-[1.5rem] border border-zinc-800/50">
             <p className="text-[10px] uppercase font-black text-zinc-700 mb-1">Authorization</p>
             <p className="text-premium-gold font-black italic text-sm">{profile?.badge || 'Silver'}</p>
          </div>
          <div className="bg-black/40 p-5 rounded-[1.5rem] border border-zinc-800/50">
             <p className="text-[10px] uppercase font-black text-zinc-700 mb-1">Deployment</p>
             <p className="text-white font-black italic text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10 pt-4 border-t border-zinc-800/50">
           <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">Referral Management</p>
           <button 
             onClick={copyReferral}
             className="w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black uppercase text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-premium-gold hover:border-premium-gold/30 hover:scale-[1.02] transition-all"
           >
             <Share2 size={18} /> Distribute Assets Link
           </button>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 py-6 rounded-[1.5rem] font-black uppercase text-xs italic tracking-tighter mt-10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-black transition-all border border-red-500/20 active:scale-95"
        >
          <LogOut size={18} /> Terminate Session
        </button>
      </div>
    </div>
  );
}
