
CREATE TABLE public.profiles (
  id text PRIMARY KEY,
  pseudo text UNIQUE NOT NULL,
  password text NOT NULL,
  level text NOT NULL DEFAULT '2ndes CRM',
  points integer NOT NULL DEFAULT 0,
  fuel integer NOT NULL DEFAULT 100,
  vehicle_owned boolean NOT NULL DEFAULT false,
  vehicle_type text NOT NULL DEFAULT 'none',
  vehicle_model text NOT NULL DEFAULT 'Aucun',
  answered_questions jsonb NOT NULL DEFAULT '{}'::jsonb,
  owned_items text[] NOT NULL DEFAULT '{}',
  customize jsonb NOT NULL DEFAULT '{"paintColor":"#ffffff","paintFinish":"glossy","wheelType":"standard","hasBullbar":false,"hasSpoiler":false,"hasRunningBoard":false,"hasVisor":false,"hasBeacons":false,"hasLightBar":false,"hasXenon":false,"cabinStripe":null,"cabinSticker":null,"trailerColor":"#ffffff","trailerLogo":null}'::jsonb,
  completed_chapters text[] NOT NULL DEFAULT '{}',
  vehicle_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

INSERT INTO public.profiles (id, pseudo, password, level, points, fuel, vehicle_owned, vehicle_type, vehicle_model)
VALUES ('test_bonjour', 'bonjour', 'bonjour', 'ETG', 999999, 999999, false, 'none', 'Aucun');
