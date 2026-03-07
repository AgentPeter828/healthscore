import { createBrowserClient } from "@supabase/ssr";
import { createMockClient } from "./mock-client";

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_DATA === "true";

export function createClient() {
  if (USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createMockClient() as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
