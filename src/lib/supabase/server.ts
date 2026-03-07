import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient } from "./mock-client";

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_DATA === "true";

export async function createClient() {
  if (USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createMockClient() as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // Server Component — cookies can only be set in middleware/route handlers
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  if (USE_MOCK) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createMockClient() as any;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
