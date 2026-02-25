-- ========================================================
-- PROJECT: ParTimer Official (Business Simulation Platform)
-- Version: 1.0 (Safe Business Simulation)
-- Description: Digital Business & Investment Simulation Command
-- ========================================================

-- 1. CORE TABLES & MIGRATIONS

-- Users with Risk Score and XP System (Business Simulation)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  coins_balance FLOAT DEFAULT 1000,
  total_hourly_rate FLOAT DEFAULT 0,
  last_collect TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_hash TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  theme_preference TEXT DEFAULT 'dark',
  language_preference TEXT DEFAULT 'bn',
  risk_score FLOAT DEFAULT 0.5,
  xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Beginner',
  referrer_id UUID REFERENCES public.users(id)
);

-- Ensure users columns exist for existing DBs (Migration Path)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'bn';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS risk_score FLOAT DEFAULT 0.5;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Beginner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.users(id);

-- Assets with Risk-Based Simulation (Stock Management)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'worker',
  price FLOAT DEFAULT 0,
  base_rate FLOAT DEFAULT 0,
  risk_level TEXT DEFAULT 'medium',
  market_sensitivity FLOAT DEFAULT 1.0,
  volatility_index FLOAT DEFAULT 0.03,
  icon TEXT DEFAULT 'Zap',
  stock_limit INTEGER DEFAULT 100,
  units_sold INTEGER DEFAULT 0,
  lifecycle_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist for existing DBs (Migration Path)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS price FLOAT DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS base_rate FLOAT DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS market_sensitivity FLOAT DEFAULT 1.0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS volatility_index FLOAT DEFAULT 0.03;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS stock_limit INTEGER DEFAULT 100;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS lifecycle_days INTEGER DEFAULT 30;

-- User Assets with Risk Modifier (Business Simulation)
CREATE TABLE IF NOT EXISTS public.user_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  asset_name TEXT NOT NULL,
  type TEXT NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_collection_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  risk_modifier FLOAT DEFAULT 1.0,
  validity_end_date TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS risk_modifier FLOAT DEFAULT 1.0;
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS validity_end_date TIMESTAMP WITH TIME ZONE;

-- Economy State Table (Dynamic Simulation)
CREATE TABLE IF NOT EXISTS public.economy_state (
  id TEXT PRIMARY KEY DEFAULT 'global',
  total_coins_circulation FLOAT DEFAULT 0,
  market_demand_index FLOAT DEFAULT 1.0,
  season_modifier FLOAT DEFAULT 1.0,
  inflation_rate FLOAT DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Settings (Master Config)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  cashout_number TEXT DEFAULT '+8801875354842',
  referral_bonus FLOAT DEFAULT 720,
  min_withdraw FLOAT DEFAULT 7200,
  is_maintenance BOOLEAN DEFAULT FALSE,
  exchange_rate FLOAT DEFAULT 720,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount_bdt FLOAT NOT NULL,
  coins_to_add FLOAT NOT NULL,
  method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals with Time Restrictions
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  amount_coins FLOAT NOT NULL,
  amount_bdt FLOAT NOT NULL,
  method TEXT,
  number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals with Double Bonus System
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id),
  referee_id UUID REFERENCES public.users(id),
  bonus_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks for Community Building
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  reward_coins FLOAT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Logs for Audit Trail
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  target_user UUID REFERENCES public.users(id),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Links for Social Integration
CREATE TABLE IF NOT EXISTS public.community_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  admin_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Investments Table (Missing from original schema)
CREATE TABLE IF NOT EXISTS public.user_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  asset_name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount FLOAT NOT NULL,
  hourly_return FLOAT DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Missing from original schema - for user balances)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  balance FLOAT DEFAULT 0,
  mining_rate FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gaming Events (E-Sports Module)
CREATE TABLE IF NOT EXISTS public.gaming_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  entry_fee_coins FLOAT NOT NULL,
  total_teams INTEGER DEFAULT 4,
  prize_pool_coins FLOAT DEFAULT 0,
  admin_commission_percent INTEGER DEFAULT 30,
  winner_id UUID REFERENCES public.users(id),
  event_status TEXT DEFAULT 'upcoming',
  event_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utility Products (Digital Marketplace)
CREATE TABLE IF NOT EXISTS public.utility_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_coins FLOAT NOT NULL,
  description TEXT,
  delivery_method TEXT DEFAULT 'email',
  stock_quantity INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AUTOMATION & SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsfeed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaming_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_products ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation
DROP POLICY IF EXISTS "Public Read Users" ON users;
CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Assets" ON assets;
CREATE POLICY "Public Read Assets" ON assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read News" ON newsfeed;
CREATE POLICY "Public Read News" ON newsfeed FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Economy" ON economy_state;
CREATE POLICY "Public Read Economy" ON economy_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Settings" ON admin_settings;
CREATE POLICY "Public Read Settings" ON admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Control" ON users;
CREATE POLICY "Admin Control" ON users FOR ALL USING (auth.email() = 'mdmarzangazi@gmail.com');

-- Transactional Policies
DROP POLICY IF EXISTS "Users view own assets" ON user_assets;
CREATE POLICY "Users view own assets" ON user_assets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own coin requests" ON coin_requests;
CREATE POLICY "Users manage own coin requests" ON coin_requests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own withdrawals" ON withdrawals;
CREATE POLICY "Users manage own withdrawals" ON withdrawals FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own referrals" ON referrals;
CREATE POLICY "Users view own referrals" ON referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- 4. MASTER FUNCTIONS

-- Handle User Registration and Verification
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, coins_balance, is_admin, is_verified, rank, risk_score)
  VALUES (
    new.id, 
    new.email, 
    1000, 
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN TRUE ELSE FALSE END,
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN TRUE ELSE FALSE END,
    CASE WHEN new.email = 'mdmarzangazi@gmail.com' THEN 'Platinum' ELSE 'Beginner' END,
    0.5
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_sync();

-- Apply Referral Bonus (Double Bonus System)
CREATE OR REPLACE FUNCTION public.apply_referral(new_user_id UUID, referrer_uuid UUID)
RETURNS void AS $$
DECLARE
  bonus_amt FLOAT;
BEGIN
  SELECT referral_bonus_coins INTO bonus_amt FROM public.admin_settings WHERE id = 'global';
  
  -- Update Referrer (Double Bonus)
  UPDATE public.users 
  SET coins_balance = coins_balance + bonus_amt,
      xp = xp + (bonus_amt * 0.1)
  WHERE id = referrer_uuid;

  -- Update Referee
  UPDATE public.users 
  SET coins_balance = coins_balance + bonus_amt,
      xp = xp + (bonus_amt * 0.1),
      referrer_id = referrer_uuid
  WHERE id = new_user_id;

  -- Log the referral
  INSERT INTO public.referrals (referrer_id, referee_id, bonus_paid)
  VALUES (referrer_uuid, new_user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dynamic Collection Engine (Business Simulation)
CREATE OR REPLACE FUNCTION public.collect_user_earnings(user_id UUID, current_device_hash TEXT)
RETURNS JSON AS $$
DECLARE
  user_rec RECORD;
  asset_rec RECORD;
  total_profit_to_credit FLOAT := 0;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  economy_state_rec RECORD;
  dynamic_rate FLOAT;
  billable_hours FLOAT;
  risk_bonus FLOAT;
  market_effect FLOAT;
  season_effect FLOAT;
  volatility_random FLOAT;
  result JSON;
BEGIN
  -- Get user and economy state
  SELECT * INTO user_rec FROM public.users WHERE id = user_id;
  SELECT * INTO economy_state_rec FROM public.economy_state WHERE id = 'global';
  
  -- Security check: Device hash validation
  IF user_rec.device_hash IS NOT NULL AND user_rec.device_hash != current_device_hash THEN
    INSERT INTO public.admin_logs (admin_id, action, target_user, details)
    VALUES (NULL, 'Security Alert: Device Mismatch', user_id, 
            json_build_object('message', 'Device fingerprint mismatch during collection'));
    RETURN json_build_object('success', false, 'message', 'Security Alert: Device fingerprint mismatch!');
  END IF;

  -- Get active worker assets
  FOR asset_rec IN 
    SELECT ua.*, a.base_rate, a.risk_level, a.market_sensitivity, a.volatility_index
    FROM public.user_assets ua
    JOIN public.assets a ON ua.asset_id = a.id
    WHERE ua.user_id = user_id AND ua.status = 'active' AND a.type = 'worker'
  LOOP
    -- Calculate billable hours (max 24 hours)
    billable_hours := EXTRACT(EPOCH FROM (current_time - asset_rec.last_collection_time)) / 3600;
    billable_hours := LEAST(24, billable_hours);

    -- Dynamic profit calculation with business simulation
    risk_bonus := 1 + (user_rec.risk_score * 0.02);
    market_effect := economy_state_rec.market_demand_index;
    season_effect := economy_state_rec.season_modifier;
    volatility_random := (random() * 0.06) - 0.03; -- -3% to +3% random

    dynamic_rate := asset_rec.base_rate 
                   * risk_bonus 
                   * market_effect 
                   * season_effect 
                   * (1 + volatility_random);

    total_profit_to_credit := total_profit_to_credit + (billable_hours * dynamic_rate);
  END LOOP;

  -- Atomic transaction
  BEGIN
    -- Update user balance
    UPDATE public.users 
    SET coins_balance = coins_balance + total_profit_to_credit,
        xp = xp + (total_profit_to_credit * 0.1),
        last_collect = current_time
    WHERE id = user_id;

    -- Reset collection time for all active assets
    UPDATE public.user_assets 
    SET last_collection_time = current_time
    WHERE user_id = user_id AND status = 'active';

    -- Update economy state
    UPDATE public.economy_state 
    SET total_coins_circulation = total_coins_circulation + total_profit_to_credit,
        last_updated = current_time
    WHERE id = 'global';

    -- Log the collection
    INSERT INTO public.admin_logs (admin_id, action, target_user, details)
    VALUES (NULL, 'Collection', user_id, 
            json_build_object('amount', total_profit_to_credit, 'type', 'user_collection'));

    RETURN json_build_object('success', true, 'credited', total_profit_to_credit);

  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Collection failed: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Economy Control Functions
CREATE OR REPLACE FUNCTION public.update_economy_parameters(
  new_market_demand FLOAT DEFAULT NULL,
  new_season_modifier FLOAT DEFAULT NULL,
  new_inflation_rate FLOAT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.economy_state 
  SET market_demand_index = COALESCE(new_market_demand, market_demand_index),
      season_modifier = COALESCE(new_season_modifier, season_modifier),
      inflation_rate = COALESCE(new_inflation_rate, inflation_rate),
      last_updated = NOW()
  WHERE id = 'global';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve Coin Request
CREATE OR REPLACE FUNCTION public.approve_coin_request(req_id UUID)
RETURNS void AS $$
DECLARE
  req_rec RECORD;
BEGIN
  SELECT * INTO req_rec FROM public.coin_requests WHERE id = req_id AND status = 'pending' FOR UPDATE;
  IF req_rec IS NOT NULL THEN
    UPDATE public.users SET coins_balance = coins_balance + req_rec.coins_to_add WHERE id = req_rec.user_id;
    UPDATE public.coin_requests SET status = 'approved' WHERE id = req_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INITIAL SEEDING (Business Simulation Assets)

-- Delete existing assets and reseed
DELETE FROM public.assets;

-- Worker Assets (Low Risk, Daily Collection Required)
INSERT INTO public.assets (name, type, price, base_rate, risk_level, market_sensitivity, lifecycle_days) VALUES 
('Rickshaw', 'worker', 7200, 0.50, 'low', 0.8, 365),
('Electric Bike', 'worker', 10000, 0.69, 'low', 0.9, 365),
('CNG', 'worker', 14200, 0.98, 'medium', 1.0, 365),
('Car (Sedan)', 'worker', 25000, 1.73, 'medium', 1.1, 365),
('Mini Truck', 'worker', 45000, 3.12, 'medium', 1.2, 365),
('Pickup Van', 'worker', 70000, 4.86, 'high', 1.3, 365),
('Passenger Bus', 'worker', 100000, 6.94, 'high', 1.4, 365),
('Cargo Truck', 'worker', 150000, 10.41, 'high', 1.5, 365),
('Excavator', 'worker', 250000, 17.36, 'high', 1.6, 365),
('Tractor', 'worker', 400000, 27.77, 'high', 1.7, 365);

-- Investor Assets (Passive, Risk-Based Returns)
INSERT INTO public.assets (name, type, price, base_rate, risk_level, market_sensitivity, lifecycle_days) VALUES 
('Small Shop', 'investor', 7200, 72, 'low', 0.5, 30),
('Mini Mart', 'investor', 14200, 284, 'medium', 0.8, 30),
('Pharmacy', 'investor', 7200, 144, 'medium', 0.9, 60),
('Tech Startup', 'investor', 50000, 1000, 'high', 1.5, 90),
('Real Estate', 'investor', 100000, 2500, 'high', 1.8, 180);

-- Initial Economy State
INSERT INTO public.economy_state (total_coins_circulation, market_demand_index, season_modifier, inflation_rate)
VALUES (0, 1.0, 1.0, 0.0)
ON CONFLICT (id) DO NOTHING;

-- Initial Admin Settings
INSERT INTO public.admin_settings (cashout_number, referral_bonus, min_withdraw, exchange_rate)
VALUES ('+8801875354842', 720, 7200, 720)
ON CONFLICT (id) DO NOTHING;

-- Community Links
INSERT INTO public.community_links (platform, url, is_active, admin_editable) VALUES
('whatsapp', 'https://chat.whatsapp.com/GPKWrKM6P7e045vp6UGsoQ', true, true),
('telegram', 'https://t.me/ParTimer_officiall', true, true),
('imo', 'https://imo.im/ParTimerOfficial', true, true)
ON CONFLICT DO NOTHING;

-- Initial Tasks
INSERT INTO public.tasks (title, reward_coins, status) VALUES
('Join Telegram Community', 100, 'active'),
('Watch Tutorial Video', 50, 'active'),
('Complete Profile Setup', 200, 'active')
ON CONFLICT DO NOTHING;

-- Initial System Broadcast
INSERT INTO public.newsfeed (message, type) VALUES 
('ParTimer Official: Business Simulation Platform Operational. Learn real business skills in a safe environment!', 'flash'),
('Remember: This is a simulation platform. No real-world financial guarantees are provided.', 'info')
ON CONFLICT DO NOTHING;

-- Verify the database setup
SELECT 'Database setup completed successfully!' as status;