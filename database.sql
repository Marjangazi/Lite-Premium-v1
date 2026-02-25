-- ========================================================
-- EXPERT DATABASE SCHEMA: Lite Premium v1 (ANTI-ERROR VERSION)
-- Run this to fix: "Policy already exists" and "Sync failures"
-- ========================================================

-- 1. CLEANUP PREVIOUS TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.approve_coin_request(UUID) CASCADE;

-- 2. ENSURE TABLES EXIST
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
  number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RESET PERMISSIONS (Fixes: "Policy already exists" Error)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Reset (Drop if exists before create)
DO $$ 
BEGIN
    -- Profiles Policies
    DROP POLICY IF EXISTS "Global Read Profiles" ON profiles;
    CREATE POLICY "Global Read Profiles" ON profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "User Manage Own Profile" ON profiles;
    CREATE POLICY "User Manage Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    DROP POLICY IF EXISTS "Admin Full Control Profiles" ON profiles;
    CREATE POLICY "Admin Full Control Profiles" ON profiles FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');

    -- Deposit Policies
    DROP POLICY IF EXISTS "User Manage Own Deposits" ON coin_requests;
    CREATE POLICY "User Manage Own Deposits" ON coin_requests FOR ALL USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Admin Full Control Deposits" ON coin_requests;
    CREATE POLICY "Admin Full Control Deposits" ON coin_requests FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');

    -- Withdrawal Policies
    DROP POLICY IF EXISTS "User Manage Own Withdrawals" ON withdrawals;
    CREATE POLICY "User Manage Own Withdrawals" ON withdrawals FOR ALL USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Admin Full Control Withdrawals" ON withdrawals;
    CREATE POLICY "Admin Full Control Withdrawals" ON withdrawals FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');
END $$;

-- 4. MASTER USER SYNC FUNCTION
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- 5. ADMIN COIN APPROVAL (With Admin Balance Deduction)
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
    UPDATE public.profiles SET balance = balance + req_amount WHERE id = target_user_id;
    UPDATE public.profiles SET balance = balance - req_amount WHERE email = admin_email;
    UPDATE public.coin_requests SET status = 'approved' WHERE id = req_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FINAL SYNC & SEED
INSERT INTO public.profiles (id, email, balance, is_admin, status, worker_level, mining_rate)
SELECT id, email, 1000, FALSE, 'active', 'Starter', 0.1 FROM auth.users 
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET is_admin = TRUE, balance = GREATEST(balance, 720000) WHERE email = 'mdmarzangazi@gmail.com';
