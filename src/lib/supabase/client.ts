import { createBrowserClient } from "@supabase/ssr";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // If we are on the server side, create a new client
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // If we are on the client side, reuse the existing client
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return supabaseBrowserClient;
}
