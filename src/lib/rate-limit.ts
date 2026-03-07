// Simple in-memory rate limiter using a Map with sliding window
// Key: IP + route, Value: array of timestamps

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export function rateLimit(
  key: string,
  {
    maxRequests,
    windowMs = 60_000,
  }: {
    maxRequests: number;
    windowMs?: number;
  }
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    return {
      success: false,
      remaining: 0,
      reset: oldestInWindow + windowMs,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    success: true,
    remaining: maxRequests - entry.timestamps.length,
    reset: now + windowMs,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// Presets
export function rateLimitApi(request: Request, route: string): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(`api:${ip}:${route}`, { maxRequests: 60, windowMs: 60_000 });
}

export function rateLimitWebhook(request: Request, route: string): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(`webhook:${ip}:${route}`, { maxRequests: 10, windowMs: 60_000 });
}

export function rateLimitExport(request: Request): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimit(`export:${ip}`, { maxRequests: 1, windowMs: 3_600_000 });
}
