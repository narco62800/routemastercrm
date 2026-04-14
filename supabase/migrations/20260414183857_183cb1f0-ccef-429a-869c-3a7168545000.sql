
-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Public insert push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete push_subscriptions" ON public.push_subscriptions FOR DELETE USING (true);

-- Rankings snapshot for detecting changes
CREATE TABLE public.user_rankings_snapshot (
  user_id text PRIMARY KEY,
  rank integer NOT NULL,
  points integer NOT NULL DEFAULT 0,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_rankings_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rankings_snapshot" ON public.user_rankings_snapshot FOR SELECT USING (true);
CREATE POLICY "Public insert rankings_snapshot" ON public.user_rankings_snapshot FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rankings_snapshot" ON public.user_rankings_snapshot FOR UPDATE USING (true);
