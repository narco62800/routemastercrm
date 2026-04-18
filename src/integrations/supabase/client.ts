import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lwaccthqrjcocyamaczn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "ta-clé-anon-icisb_secret_2crP1mXj5SuivKOQX2ZmWA_z90gGuLr";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});