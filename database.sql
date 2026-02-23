-- 1. Profiles Table (Only create if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  balance FLOAT DEFAULT 10000, -- 1st time 10,000 coins bonus
  worker_level TEXT DEFAULT 'Starter',
  mining_rate FLOAT DEFAULT 0.1, -- Daily 0.1 rate
  last_collect TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer_id UUID
);

-- Enable RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies before creating to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  method TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop policies before creating
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;

CREATE POLICY "Users can view own withdrawals" 
ON withdrawals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" 
ON withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);
