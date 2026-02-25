import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Withdraw from './pages/Withdraw';
import Deposit from './pages/Deposit';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import { LayoutDashboard, ShoppingCart, Banknote, User, LogOut, ShieldAlert, PlusCircle } from 'lucide-react';
import { ToastProvider } from './lib/ToastContext';

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
    setProfile(data);
  };

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  if (!session) {
    return (
      <ToastProvider>
        <Auth />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-premium-dark text-white">
          <main className="pb-24">
            <Routes>
              <Route path="/" element={<Dashboard user={session.user} />} />
              <Route path="/shop" element={<Shop profile={profile} user={session.user} onUpdate={fetchProfile} />} />
              <Route path="/deposit" element={<Deposit profile={profile} user={session.user} onUpdate={fetchProfile} />} />
              <Route path="/withdraw" element={<Withdraw profile={profile} user={session.user} onUpdate={fetchProfile} />} />
              <Route path="/profile" element={<ProfilePage user={session.user} profile={profile} onUpdate={fetchProfile} />} />
              <Route path="/admin" element={<Admin user={session.user} />} />
            </Routes>
          </main>
          <Navbar user={session.user} />
        </div>
      </Router>
    </ToastProvider>
  );
}

function Navbar({ user }) {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/shop', icon: ShoppingCart, label: 'Shop' },
    { path: '/deposit', icon: PlusCircle, label: 'Add Coin' },
    { path: '/withdraw', icon: Banknote, label: 'Cashout' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  if (user?.email === 'mdmarzangazi@gmail.com') {
    navItems.push({ path: '/admin', icon: ShieldAlert, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-2 flex justify-around items-center z-50 shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 ${
              isActive 
                ? 'bg-premium-gold text-black scale-110 shadow-neon-gold' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ProfilePage({ user, profile }) {
  const handleSignOut = () => supabase.auth.signOut();

  return (
    <div className="p-6 max-w-lg mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold neon-text text-premium-gold">My Account</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your identity and security</p>
      </header>

      <div className="premium-card space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-premium-gold/20 flex items-center justify-center border border-premium-gold/30">
            <User size={32} className="text-premium-gold" />
          </div>
          <div>
            <h2 className="font-bold text-xl">{user.email.split('@')[0]}</h2>
            <p className="text-zinc-500 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
             <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Status</p>
             <p className="text-premium-gold font-bold">{profile?.worker_level || 'Inactive'}</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
             <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Joined</p>
             <p className="text-white font-bold">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-zinc-800 text-red-400 hover:bg-red-500/10 transition-colors border border-zinc-700 hover:border-red-500/30"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}
