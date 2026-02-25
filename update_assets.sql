-- CLEANUP ASSETS
DELETE FROM public.assets;

-- INSERT WORKER ASSETS (5% Monthly Fixed Profit Logic)
-- Note: 'rate' is Coins/Hour. 720 hours = 30 days.
-- Price * 0.05 / 720 = Hourly Rate
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

-- INSERT INVESTOR ASSETS (Scarcity: 100 units each)
-- 'profit_tier_coins' is the MONTHLY profit.
INSERT INTO public.assets (name, type, price, profit_tier_coins, icon, stock_limit, lifecycle_days) VALUES 
('Small Shop', 'investor', 7200, 72, 'Store', 100, 30),  -- 1% of 7200
('Mini Mart', 'investor', 14200, 284, 'ShoppingBag', 100, 30), -- 2% of 14200
('Pharmacy', 'investor', 7200, 144, 'PlusSquare', 100, 60); -- 2% of 7200, 2 Months Lifecycle
