import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lwaccthqrjcocyamaczn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YWNjdGhxcmpjb2N5YW1hY3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mzc3MDksImV4cCI6MjA5MjAxMzcwOX0.L70ywsKeHsNcNN9w2e8GQPjF7ylra9iTuIKxIq8aFZI";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
