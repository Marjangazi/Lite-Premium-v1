import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './lib/ThemeContext';
import { ToastProvider } from './lib/ToastContext';
import { deviceFingerprint } from './lib/deviceFingerprint';
import { collectionEngine } from './lib/collectionEngine';
import LoadingSpinner from './components/LoadingSpinner';
import Toast from './components/Toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import './index.css';

// Lazy load pages for better performance
const Auth = React.lazy(() => import('./pages/Auth'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Deposit = React.lazy(() => import('./pages/Deposit'));
const Withdraw = React.lazy(() => import('./pages/Withdraw'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Community = React.lazy(() => import('./pages/Community'));

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize device fingerprinting
    const initializeApp = async () => {
      try {
        // Validate device fingerprint
        const validation = await deviceFingerprint.validateFingerprint();
        
        if (!validation.isValid && !validation.isNewDevice) {
          console.warn('Device fingerprint mismatch detected');
          // Could show security warning to user
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setLoading(false);
          setIsInitialized(true);
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setSession(session);
          setLoading(false);
          setIsInitialized(true);

          // Initialize collection engine for authenticated users
          if (session) {
            await collectionEngine.initialize(session.user.id);
          } else {
            collectionEngine.stop();
          }
        });

        return () => subscription.unsubscribe();

      } catch (error) {
        console.error('App initialization failed:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="App min-h-screen bg-gray-900">
            <Navbar session={session} onSidebarToggle={() => {}} />
            <Sidebar isOpen={false} onClose={() => {}} session={session} />
            <main className="lg:ml-64">
              <div className="min-h-screen">
                <Routes>
                  <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} />
                  <Route path="/shop" element={session ? <Shop session={session} /> : <Navigate to="/auth" />} />
                  <Route path="/deposit" element={session ? <Deposit session={session} /> : <Navigate to="/auth" />} />
                  <Route path="/withdraw" element={session ? <Withdraw session={session} /> : <Navigate to="/auth" />} />
                  <Route path="/community" element={session ? <Community session={session} /> : <Navigate to="/auth" />} />
                  <Route path="/admin" element={session ? <Admin session={session} /> : <Navigate to="/auth" />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
              <Footer />
            </main>
            <Toast />
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;