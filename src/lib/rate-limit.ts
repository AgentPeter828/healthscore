// Production rate limiter
// Uses @upstash/ratelimit + @upstash/redis when configured
// Falls back to in-memory sliding window when Upstash is not available

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
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

// In-memory fallback rate limiter
function inMemoryRateLimit(
  key: string,
  { maxRequests, windowMs = 60_000 }: { maxRequests: number; windowMs?: number }
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

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

// Upstash rate limiter (lazy-initialized)
let upstashLimiterCache: Map<string, unknown> | null = null;

function getUpstashAvailable(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstashRateLimit(
  key: string,
  { maxRequests, windowMs = 60_000 }: { maxRequests: number; windowMs?: number }
): Promise<RateLimitResult> {
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    if (!upstashLimiterCache) {
      upstashLimiterCache = new Map();
    }

    const cacheKey = `${maxRequests}:${windowMs}`;
    let limiter = upstashLimiterCache.get(cacheKey) as InstanceType<typeof Ratelimit> | undefined;

    if (!limiter) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
        prefix: "hs_rl",
      });

      upstashLimiterCache.set(cacheKey, limiter);
    }

    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    console.warn("Upstash rate limit failed, falling back to in-memory:", err);
    return inMemoryRateLimit(key, { maxRequests, windowMs });
  }
}

/**
 * Rate limit a request. Uses Upstash when configured, falls back to in-memory.
 */
export async function rateLimit(
  key: string,
  options: { maxRequests: number; windowMs?: number }
): Promise<RateLimitResult> {
  if (getUpstashAvailable()) {
    return upstashRateLimit(key, options);
  }
  return inMemoryRateLimit(key, options);
}

/**
 * Synchronous rate limit for backward compatibility (in-memory only).
 */
export function rateLimitSync(
  key: string,
  options: { maxRequests: number; windowMs?: number }
): RateLimitResult {
  return inMemoryRateLimit(key, options);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// Presets — async versions (use Upstash when available)

export async function rateLimitAI(request: Request, orgId: string): Promise<RateLimitResult> {
  return rateLimit(`ai:${orgId}`, { maxRequests: 10, windowMs: 60_000 });
}

export async function rateLimitApiAsync(request: Request, route: string): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return rateLimit(`api:${ip}:${route}`, { maxRequests: 100, windowMs: 60_000 });
}

export async function rateLimitExportAsync(request: Request): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return rateLimit(`export:${ip}`, { maxRequests: 1, windowMs: 3_600_000 });
}

export async function rateLimitWebhookAsync(request: Request, route: string): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return rateLimit(`webhook:${ip}:${route}`, { maxRequests: 10, windowMs: 60_000 });
}

// Backward-compatible synchronous presets (in-memory only)

export function rateLimitApi(request: Request, route: string): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimitSync(`api:${ip}:${route}`, { maxRequests: 60, windowMs: 60_000 });
}

export function rateLimitWebhook(request: Request, route: string): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimitSync(`webhook:${ip}:${route}`, { maxRequests: 10, windowMs: 60_000 });
}

export function rateLimitExport(request: Request): RateLimitResult {
  const ip = getClientIp(request);
  return rateLimitSync(`export:${ip}`, { maxRequests: 1, windowMs: 3_600_000 });
}
