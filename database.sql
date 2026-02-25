-- ========================================================
-- FINAL EXPERT DATABASE SCHEMA: Lite Premium v1 (THE COMPLETE SOLUTION)
-- This file handles User Creation, Coin Approval, Admin Balance, and Withdrawals.
-- ========================================================

-- 1. DROP CONFLICTING OBJECTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.approve_coin_request(UUID) CASCADE;

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  balance FLOAT DEFAULT 1000,
  worker_level TEXT DEFAULT 'Starter',
  mining_rate FLOAT DEFAULT 0.1,
  status TEXT DEFAULT 'active',
  is_admin BOOLEAN DEFAULT FALSE,
  last_collect TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'worker',
  price FLOAT NOT NULL,
  rate FLOAT DEFAULT 0,
  profit_percent FLOAT DEFAULT 0,
  icon TEXT DEFAULT 'Zap',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  amount FLOAT NOT NULL,
  profit_percent FLOAT NOT NULL,
  hourly_return FLOAT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.coin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount FLOAT NOT NULL,
  method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount FLOAT NOT NULL,
  method TEXT,
  number TEXT, -- Bkash/Nagad number
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Allow Global Read for profiles and assets
DROP POLICY IF EXISTS "Global Read Profiles" ON profiles;
CREATE POLICY "Global Read Profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Global Read Assets" ON assets;
CREATE POLICY "Global Read Assets" ON assets FOR SELECT USING (true);

-- User Own Data Access
DROP POLICY IF EXISTS "User Manage Own Profile" ON profiles;
CREATE POLICY "User Manage Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "User Manage Own Investments" ON user_investments;
CREATE POLICY "User Manage Own Investments" ON user_investments FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User Manage Own Deposits" ON coin_requests;
CREATE POLICY "User Manage Own Deposits" ON coin_requests FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User Manage Own Withdrawals" ON withdrawals;
CREATE POLICY "User Manage Own Withdrawals" ON withdrawals FOR ALL USING (auth.uid() = user_id);

-- Admin Overrides (mdmarzangazi@gmail.com)
CREATE POLICY "Admin Full Control Profiles" ON profiles FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');
CREATE POLICY "Admin Full Control Deposits" ON coin_requests FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');
CREATE POLICY "Admin Full Control Withdrawals" ON withdrawals FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');

-- 4. MASTER USER SYNC FUNCTION (Signup/Login Trigger)
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, balance, is_admin, status, worker_level, mining_rate)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN 720000 ELSE 1000 END,
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN TRUE ELSE FALSE END,
    'active',
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN 'Admin' ELSE 'Starter' END,
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN 0 ELSE 0.1 END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    status = 'active';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- 5. EXPERT RPC: APPROVE COIN & DEDUCT FROM ADMIN
CREATE OR REPLACE FUNCTION public.approve_coin_request(req_id UUID)
RETURNS void AS $$
DECLARE
  target_user_id UUID;
  req_amount FLOAT;
  admin_email TEXT := 'mdmarzangazi@gmail.com';
BEGIN
  SELECT user_id, amount INTO target_user_id, req_amount 
  FROM public.coin_requests WHERE id = req_id AND status = 'pending';

  IF target_user_id IS NOT NULL THEN
    -- Add to user
    UPDATE public.profiles SET balance = balance + req_amount WHERE id = target_user_id;
    -- Deduct from admin
    UPDATE public.profiles SET balance = balance - req_amount WHERE email = admin_email;
    -- Success
    UPDATE public.coin_requests SET status = 'approved' WHERE id = req_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. INITIAL SETUP
-- Auto-sync all existing users into profile table
INSERT INTO public.profiles (id, email, balance, is_admin, status, worker_level, mining_rate)
SELECT id, email, 1000, FALSE, 'active', 'Starter', 0.1 
FROM auth.users 
ON CONFLICT (id) DO NOTHING;

-- Force Admin Admin Data
UPDATE public.profiles SET is_admin = TRUE, balance = 720000 WHERE email = 'mdmarzangazi@gmail.com';

-- Asset Seeding
INSERT INTO public.assets (name, type, price, rate, icon) VALUES 
('Starter Worker', 'worker', 0, 0.1, 'HardHat'),
('Digital Worker', 'worker', 5000, 1.0, 'Zap'),
('Mining Pro', 'worker', 15000, 5.0, 'Shield'),
('Premium Investor', 'worker', 50000, 25.0, 'Crown')
ON CONFLICT DO NOTHING;

INSERT INTO public.assets (name, type, price, profit_percent, icon) VALUES 
('Riksha', 'vehicle', 1000, 5, 'Truck'),
('Van', 'vehicle', 2000, 5, 'Truck'),
('Auto', 'vehicle', 3000, 5, 'Car'),
('CNG', 'vehicle', 4000, 5, 'CarFront'),
('Car', 'vehicle', 5000, 5, 'Car')
ON CONFLICT DO NOTHING;
