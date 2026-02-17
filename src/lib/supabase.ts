import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kjbuvqcrbyskzvpyykuw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYnV2cWNyYnlza3p2cHl5a3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODk3NDMsImV4cCI6MjA4Njg2NTc0M30.eI5KfcXeFm7yBBfNhjyvikx95-OXw7psYnsTlM7ZriQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
