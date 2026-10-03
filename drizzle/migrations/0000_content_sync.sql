CREATE TABLE public.question_overrides (
  id text PRIMARY KEY,
  data jsonb,
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_overrides TO anon, authenticated;
GRANT ALL ON public.question_overrides TO service_role;
ALTER TABLE public.question_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read question_overrides" ON public.question_overrides FOR SELECT USING (true);
CREATE POLICY "Public insert question_overrides" ON public.question_overrides FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update question_overrides" ON public.question_overrides FOR UPDATE USING (true);
CREATE POLICY "Public delete question_overrides" ON public.question_overrides FOR DELETE USING (true);

CREATE TABLE public.content_state (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_state TO anon, authenticated;
GRANT ALL ON public.content_state TO service_role;
ALTER TABLE public.content_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read content_state" ON public.content_state FOR SELECT USING (true);
CREATE POLICY "Public insert content_state" ON public.content_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update content_state" ON public.content_state FOR UPDATE USING (true);