-- Allow all authenticated users to view all profiles (for rankings)
CREATE POLICY "Anyone can view all profiles for rankings"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to view all user stats (for rankings)
CREATE POLICY "Anyone can view all stats for rankings"
ON public.user_stats
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to view all subscriptions (for rankings)
CREATE POLICY "Anyone can view all subscriptions for rankings"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (true);