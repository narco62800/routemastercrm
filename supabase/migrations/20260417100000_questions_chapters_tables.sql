-- Migration: Create questions and chapters tables
-- Date: 2026-04-17
-- Already executed in Supabase SQL Editor — committed here for history

-- Table: public.questions
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'qcm',
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: public.chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chapters_level_subject_title_key UNIQUE (level, subject, title)
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Policies: Public access (SELECT / INSERT / UPDATE / DELETE)
CREATE POLICY IF NOT EXISTS "Public questions select" ON public.questions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public questions insert" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public questions update" ON public.questions FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Public questions delete" ON public.questions FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Public chapters select" ON public.chapters FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public chapters insert" ON public.chapters FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public chapters update" ON public.chapters FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Public chapters delete" ON public.chapters FOR DELETE USING (true);
