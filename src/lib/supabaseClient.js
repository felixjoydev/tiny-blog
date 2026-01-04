import { createBrowserClient } from "@supabase/ssr";

// Browser client for React islands - uses cookies for SSR compatibility
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
