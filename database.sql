-- ========================================================
-- PROJECT: LitePremium (Expert Financial Schema)
-- Version: 3.0 (Official Rebrand)
-- Description: Digital Business & Investment Command
-- ========================================================

-- 1. CORE TABLES & MIGRATIONS

-- Profiles with Badge & Referral System (Rebranded to LitePremium)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  balance FLOAT DEFAULT 1000,
  badge TEXT DEFAULT 'Silver',
  bonus_rate FLOAT DEFAULT 0,
  status TEXT DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  referrer_id UUID REFERENCES public.profiles(id),
  referral_count INTEGER DEFAULT 0,
  last_collect TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  telegram TEXT,
  whatsapp TEXT,
  imo TEXT,
  bdt_number TEXT
);

-- Ensure profiles columns exist for existing DBs (Migration Path)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS imo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bdt_number TEXT;

-- Global Admin Settings (LitePremium Master Config)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  cashout_number TEXT DEFAULT '+8801875354842',
  referral_bonus FLOAT DEFAULT 720,
  min_withdraw FLOAT DEFAULT 7200,
  is_maintenance BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets with Scarcity (Stock Management)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'worker',
  price FLOAT NOT NULL,
  rate FLOAT DEFAULT 0,
  profit_tier_coins FLOAT DEFAULT 0,
  icon TEXT DEFAULT 'Zap',
  stock_limit INTEGER DEFAULT 100,
  units_sold INTEGER DEFAULT 0,
  lifecycle_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS stock_limit INTEGER DEFAULT 100;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS lifecycle_days INTEGER DEFAULT 30;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS profit_tier_coins FLOAT DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'worker';

-- Investments with Expiry Tracking
CREATE TABLE IF NOT EXISTS public.user_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  asset_name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount FLOAT NOT NULL,
  hourly_return FLOAT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

ALTER TABLE public.user_investments ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id);
ALTER TABLE public.user_investments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'worker';
ALTER TABLE public.user_investments ADD COLUMN IF NOT EXISTS hourly_return FLOAT DEFAULT 0;
ALTER TABLE public.user_investments ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

-- Newsfeed Table
CREATE TABLE IF NOT EXISTS public.newsfeed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'flash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Transactions (Deposits)
CREATE TABLE IF NOT EXISTS public.coin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount_bdt FLOAT NOT NULL,
  coins_to_add FLOAT NOT NULL,
  method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.coin_requests ADD COLUMN IF NOT EXISTS amount_bdt FLOAT DEFAULT 0;
ALTER TABLE public.coin_requests ADD COLUMN IF NOT EXISTS coins_to_add FLOAT DEFAULT 0;

-- Withdrawals with Time Restrictions
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount_coins FLOAT NOT NULL,
  amount_bdt FLOAT NOT NULL,
  method TEXT,
  number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AUTOMATION & SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsfeed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Assets" ON assets;
CREATE POLICY "Public Read Assets" ON assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read News" ON newsfeed;
CREATE POLICY "Public Read News" ON newsfeed FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Settings" ON admin_settings;
CREATE POLICY "Public Read Settings" ON admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Control" ON profiles;
CREATE POLICY "Admin Control" ON profiles FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');

-- Transactional Policies
DROP POLICY IF EXISTS "Users view own investments" ON user_investments;
CREATE POLICY "Users view own investments" ON user_investments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own coin requests" ON coin_requests;
CREATE POLICY "Users manage own coin requests" ON coin_requests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own withdrawals" ON withdrawals;
CREATE POLICY "Users manage own withdrawals" ON withdrawals FOR ALL USING (auth.uid() = user_id);

-- 4. MASTER FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, balance, is_admin, is_verified, badge)
  VALUES (
    new.id, 
    new.email, 
    1000, 
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN TRUE ELSE FALSE END,
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN TRUE ELSE FALSE END,
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN 'Platinum' ELSE 'Silver' END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- Process Referral Reward
CREATE OR REPLACE FUNCTION public.apply_referral(new_user_id UUID, referrer_uuid UUID)
RETURNS void AS $$
DECLARE
  bonus_amt FLOAT;
BEGIN
  SELECT referral_bonus INTO bonus_amt FROM public.admin_settings WHERE id = 'global';
  
  -- Update Referrer
  UPDATE public.profiles 
  SET balance = balance + bonus_amt,
      referral_count = referral_count + 1
  WHERE id = referrer_uuid;

  -- Link New User
  UPDATE public.profiles 
  SET referrer_id = referrer_uuid
  WHERE id = new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. BUSINESS LOGIC: Income Collection (Worker Penalty + Investor Linear)
CREATE OR REPLACE FUNCTION public.collect_earnings_expert(target_user_id UUID)
RETURNS void AS $$
DECLARE
  profile_rec RECORD;
  inv_rec RECORD;
  total_user_profit FLOAT := 0;
  total_admin_penalty FLOAT := 0;
  hours_diff FLOAT;
  safe_hours FLOAT := 24;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  admin_id UUID;
BEGIN
  -- 1. Identify Overseer
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'mdmarzangazi@gmail.com' LIMIT 1;
  
  -- 2. Fetch Portfolio
  SELECT * INTO profile_rec FROM public.profiles WHERE id = target_user_id;

  -- 3. Loop through active asset vectors
  FOR inv_rec IN SELECT * FROM public.user_investments WHERE user_id = target_user_id AND status = 'active' LOOP
    hours_diff := EXTRACT(EPOCH FROM (current_time - profile_rec.last_collect)) / 3600;
    
    IF inv_rec.type = 'worker' THEN
      -- WORKER LOGIC: Requires daily engagement (24h Window)
      IF hours_diff <= safe_hours THEN
        total_user_profit := total_user_profit + (hours_diff * inv_rec.hourly_return);
      ELSE
        total_user_profit := total_user_profit + (safe_hours * inv_rec.hourly_return);
        total_admin_penalty := total_admin_penalty + ((hours_diff - safe_hours) * inv_rec.hourly_return);
      END IF;
    ELSE
      -- INVESTOR LOGIC: Passive Monthly Linear yield (No engagement penalty)
      DECLARE
        asset_profit FLOAT;
      BEGIN
        SELECT profit_tier_coins INTO asset_profit FROM public.assets WHERE id = inv_rec.asset_id;
        total_user_profit := total_user_profit + (hours_diff * (COALESCE(asset_profit, 0) / 720));
      END;
    END IF;
  END LOOP;

  -- 4. Apply Badge Multipliers (Loyalty Rewards)
  IF profile_rec.badge IN ('Gold', 'Platinum') THEN
    total_user_profit := total_user_profit * 1.005; -- 0.5% Loyalty Bonus
  END IF;

  -- 5. Atomic Update
  UPDATE public.profiles 
  SET balance = balance + total_user_profit,
      last_collect = current_time
  WHERE id = target_user_id;

  -- 6. Diversion to Reserves (Missed worker collections)
  IF total_admin_penalty > 0 AND admin_id IS NOT NULL THEN
    UPDATE public.profiles SET balance = balance + total_admin_penalty WHERE id = admin_id;
  END IF;

  -- 7. CLEANUP EXPIRED ASSETS (Lifecycle Termination)
  UPDATE public.user_investments 
  SET status = 'expired' 
  WHERE user_id = target_user_id AND (
    expiry_date <= current_time 
    OR (SELECT lifecycle_days * interval '1 day' FROM public.assets WHERE id = asset_id) + start_date <= current_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC HELPERS
CREATE OR REPLACE FUNCTION public.approve_coin_request(req_id UUID)
RETURNS void AS $$
DECLARE
  req_rec RECORD;
BEGIN
  SELECT * INTO req_rec FROM public.coin_requests WHERE id = req_id AND status = 'pending' FOR UPDATE;
  IF req_rec IS NOT NULL THEN
    UPDATE public.profiles SET balance = balance + req_rec.coins_to_add WHERE id = req_rec.user_id;
    UPDATE public.coin_requests SET status = 'approved' WHERE id = req_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment(row_id UUID, table_name TEXT, column_name TEXT, amount FLOAT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE public.%I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
  USING amount, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. INITIAL ASSET SEEDING (LitePremium Official Models)
DELETE FROM public.assets;

-- WORKER MODELS (5% Monthly Return Logic)
INSERT INTO public.assets (name, type, price, rate, icon, stock_limit, lifecycle_days) VALUES 
('Rickshaw', 'worker', 7200, 0.50, 'HardHat', 1000, 30),
('Electric Bike', 'worker', 10000, 0.69, 'Zap', 1000, 30),
('CNG', 'worker', 14200, 0.98, 'Activity', 1000, 30),
('Car (Sedan)', 'worker', 25000, 1.73, 'Shield', 1000, 30),
('Mini Truck', 'worker', 45000, 3.12, 'Layers', 1000, 30),
('Pickup Van', 'worker', 70000, 4.86, 'Truck', 1000, 30),
('Passenger Bus', 'worker', 100000, 6.94, 'Bus', 1000, 30),
('Cargo Truck', 'worker', 150000, 10.41, 'Container', 1000, 30),
('Excavator', 'worker', 250000, 17.36, 'Hammer', 1000, 30),
('Tractor', 'worker', 400000, 27.77, 'Tractor', 1000, 30);

-- INVESTOR MODELS (Fixed Strategy)
INSERT INTO public.assets (name, type, price, profit_tier_coins, icon, stock_limit, lifecycle_days) VALUES 
('Small Shop', 'investor', 7200, 72, 'Store', 100, 30),
('Mini Mart', 'investor', 14200, 284, 'ShoppingCart', 100, 30),
('Pharmacy', 'investor', 7200, 144, 'PlusSquare', 100, 60);

-- INITIAL SYSTEM BROADCAST
INSERT INTO public.newsfeed (message) VALUES ('LitePremium Protocol: Operational. All assets carry a strictly monitored 24h collection cycle.')
ON CONFLICT DO NOTHING;
