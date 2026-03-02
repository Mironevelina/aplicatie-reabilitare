import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxqtbtqfplfcvdhimxat.supabase.co';
const supabaseAnonKey = 'sb_publishable_H6pzArNYmjjummFEKXpAvw_5wWH8sNN';

// ADAUGĂ CUVÂNTUL export ÎN FAȚĂ!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);