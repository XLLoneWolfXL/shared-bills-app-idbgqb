
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://xnveszejbsnwdfjmrdmz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudmVzemVqYnNud2Rmam1yZG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg1OTIsImV4cCI6MjA3Njg0NDU5Mn0.e3-xU0Rqhryjox7bGwaSf3b5wuzGxO8gHpGc5Sg3Ox8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
