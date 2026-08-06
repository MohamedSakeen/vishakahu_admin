import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string) => {
  const raw = process.env[key] || '';
  return raw.trim().replace(/^["']|["']$/g, '');
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://vxqneiuxtzxrmlehrxgj.supabase.co';
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || 'sb_publishable_bmVRuC3Frz2w0Tx7rg_TQA_p8TWt1gu';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface StudentRegistration {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}
