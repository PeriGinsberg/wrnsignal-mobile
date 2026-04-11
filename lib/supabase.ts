import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ejhnokcnahauvrcbcmic.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqaG5va2NuYWhhdXZyY2JjbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzczNzMsImV4cCI6MjA4MzcxMzM3M30.LzTMZDzDrx4UMWGu9y5qeg4AzwxukEWUu06q7Ts9Wb0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
