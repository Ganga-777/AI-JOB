// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ffvwrxqbwdeymlxtonaq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdndyeHFid2RleW1seHRvbmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NjE4MzcsImV4cCI6MjA1MzEzNzgzN30.Ymrk4kJxVrIeTXCN_-3AdU0zsCjlxTTRTiDu2ebCHos";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);