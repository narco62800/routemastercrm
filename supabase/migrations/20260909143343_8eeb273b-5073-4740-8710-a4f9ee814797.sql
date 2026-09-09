CREATE TABLE public.chapter_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  document_url text,
  est_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level, subject, title)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_meta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_meta TO authenticated;
GRANT ALL ON public.chapter_meta TO service_role;

ALTER TABLE public.chapter_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read chapter_meta" ON public.chapter_meta FOR SELECT USING (true);
CREATE POLICY "Public insert chapter_meta" ON public.chapter_meta FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update chapter_meta" ON public.chapter_meta FOR UPDATE USING (true);
CREATE POLICY "Public delete chapter_meta" ON public.chapter_meta FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chapter_meta_updated_at BEFORE UPDATE ON public.chapter_meta
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();