-- Database Schema Update for Lite Premium v1 (Run this in Supabase SQL Editor)

-- 1. Profiles Table (CRITICAL: Fixes "Database error saving new user")
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  balance FLOAT DEFAULT 1000,
  worker_level TEXT DEFAULT 'Starter',
  mining_rate FLOAT DEFAULT 0.1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Asset/Shop System
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'worker', -- 'worker' or 'vehicle'
  price FLOAT NOT NULL,
  rate FLOAT DEFAULT 0, -- Hourly rate for 'worker'
  profit_percent FLOAT DEFAULT 0, -- Monthly profit % for 'vehicle'
  icon TEXT DEFAULT 'Zap',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view assets" ON assets;
CREATE POLICY "Anyone can view assets" ON assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage assets" ON assets;
CREATE POLICY "Admin can manage assets" ON assets USING (auth.email() = 'mdmarzangazi@gmail.com');

-- 3. User Investments System
CREATE TABLE IF NOT EXISTS user_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  amount FLOAT NOT NULL,
  profit_percent FLOAT NOT NULL,
  hourly_return FLOAT NOT NULL, -- Calculated during purchase
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own investments" ON user_investments;
CREATE POLICY "Users can view own investments" ON user_investments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investments" ON user_investments;
CREATE POLICY "Users can insert own investments" ON user_investments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  method TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
CREATE POLICY "Users can create withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Admin Permissions
-- Admin View All
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (auth.email() = 'mdmarzangazi@gmail.com');

DROP POLICY IF EXISTS "Admin can view all withdrawals" ON withdrawals;
CREATE POLICY "Admin can view all withdrawals" ON withdrawals FOR SELECT USING (auth.email() = 'mdmarzangazi@gmail.com');

-- Admin Update All
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
CREATE POLICY "Admin can update all profiles" ON profiles FOR UPDATE USING (auth.email() = 'mdmarzangazi@gmail.com');

DROP POLICY IF EXISTS "Admin can update all withdrawals" ON withdrawals;
CREATE POLICY "Admin can update all withdrawals" ON withdrawals FOR UPDATE USING (auth.email() = 'mdmarzangazi@gmail.com');

-- 6. Automate Profile Creation Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  -- Check total non-admin users
  SELECT count(*) INTO user_count FROM profiles WHERE email != 'mdmarzangazi@gmail.com';

  IF new.email = 'mdmarzangazi@gmail.com' THEN
    INSERT INTO public.profiles (id, email, balance, worker_level, mining_rate, status)
    VALUES (new.id, new.email, 720000, 'Admin', 0, 'active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      status = 'active';
  ELSIF (user_count < 10) THEN
    -- First 10 users get 100k
    INSERT INTO public.profiles (id, email, balance, worker_level, mining_rate, status)
    VALUES (new.id, new.email, 100000, 'Starter', 0.1, 'active')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Rest get 10k
    INSERT INTO public.profiles (id, email, balance, worker_level, mining_rate, status)
    VALUES (new.id, new.email, 10000, 'Starter', 0.1, 'active')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Initial Default Assets
INSERT INTO assets (name, type, price, rate, icon) VALUES 
('Starter Worker', 'worker', 0, 0.1, 'HardHat'),
('Digital Worker', 'worker', 5000, 1.0, 'Zap'),
('Mining Pro', 'worker', 15000, 5.0, 'Shield'),
('Premium Investor', 'worker', 50000, 25.0, 'Crown')
ON CONFLICT DO NOTHING;

INSERT INTO assets (name, type, price, profit_percent, icon) VALUES 
('Riksha', 'vehicle', 1000, 5, 'Truck'),
('Van', 'vehicle', 2000, 5, 'Truck'),
('Auto', 'vehicle', 3000, 5, 'Car'),
('CNG', 'vehicle', 4000, 5, 'CarFront'),
('Car', 'vehicle', 5000, 5, 'Car')
ON CONFLICT DO NOTHING;
