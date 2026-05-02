import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shlxdjdopplnyxzpiclg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobHhkamRvcHBsbnl4enBpY2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzkyOTMsImV4cCI6MjA5MzI1NTI5M30.YjsLVy9gi2Uftw43iRgdKjVbeewn8H8D7bcRBN5i0Ow';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
