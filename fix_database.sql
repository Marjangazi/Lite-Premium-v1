-- Fix for missing base_rate column in assets table
-- Run this in your Supabase SQL editor

-- Add the missing base_rate column if it doesn't exist
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS base_rate FLOAT DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets' AND column_name = 'base_rate';

-- If you need to reseed the assets data, run this:
DELETE FROM public.assets;

-- Worker Assets (Low Risk, Daily Collection Required)
INSERT INTO public.assets (name, type, price_coins, base_rate, risk_level, market_sensitivity, lifecycle_days) VALUES 
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
INSERT INTO public.assets (name, type, price_coins, base_rate, risk_level, market_sensitivity, lifecycle_days) VALUES 
('Small Shop', 'investor', 7200, 72, 'low', 0.5, 30),
('Mini Mart', 'investor', 14200, 284, 'medium', 0.8, 30),
('Pharmacy', 'investor', 7200, 144, 'medium', 0.9, 60),
('Tech Startup', 'investor', 50000, 1000, 'high', 1.5, 90),
('Real Estate', 'investor', 100000, 2500, 'high', 1.8, 180);

-- Update economy state if needed
INSERT INTO public.economy_state (total_coins_circulation, market_demand_index, season_modifier, inflation_rate)
VALUES (0, 1.0, 1.0, 0.0)
ON CONFLICT (id) DO NOTHING;

-- Update admin settings if needed
INSERT INTO public.admin_settings (cashout_number, referral_bonus_coins, min_withdraw_coins, exchange_rate_coins_per_bdt)
VALUES ('+8801875354842', 720, 7200, 720)
ON CONFLICT (id) DO NOTHING;

-- Add community links if needed
INSERT INTO public.community_links (platform, url, is_active, admin_editable) VALUES
('whatsapp', 'https://chat.whatsapp.com/GPKWrKM6P7e045vp6UGsoQ', true, true),
('telegram', 'https://t.me/ParTimer_officiall', true, true),
('imo', 'https://imo.im/ParTimerOfficial', true, true)
ON CONFLICT DO NOTHING;

-- Add initial tasks if needed
INSERT INTO public.tasks (title, reward_coins, status) VALUES
('Join Telegram Community', 100, 'active'),
('Watch Tutorial Video', 50, 'active'),
('Complete Profile Setup', 200, 'active')
ON CONFLICT DO NOTHING;

-- Add initial news if needed
INSERT INTO public.newsfeed (message, type) VALUES 
('ParTimer Official: Business Simulation Platform Operational. Learn real business skills in a safe environment!', 'flash'),
('Remember: This is a simulation platform. No real-world financial guarantees are provided.', 'info')
ON CONFLICT DO NOTHING;

SELECT 'Database fix completed successfully!' as status;