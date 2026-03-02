import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("EROARE: Lipsesc configurările Supabase în fișierul .env!");
}

// Creăm clientul cu cheia de Admin (Service Role)
// Aceasta va fi folosită doar pe server!
export const supabase = createClient(supabaseUrl, supabaseServiceKey);