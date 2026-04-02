import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for local development
const memoryStore = new Map<
  string,
  { count: number; resetTime: number }
>();

// Rate limiters configuration
const limiters = {
  // Strict: 5 requests per minute (for sensitive operations)
  strict: {
    requests: 5,
    window: 60000, // 1 minute
  },
  // Normal: 30 requests per minute (for standard API routes)
  normal: {
    requests: 30,
    window: 60000, // 1 minute
  },
  // Public: 100 requests per minute (for public routes)
  public: {
    requests: 100,
    window: 60000, // 1 minute
  },
  // Cron: 3 requests per minute (for cron jobs)
  cron: {
    requests: 3,
    window: 60000, // 1 minute
  },
};

function getMemoryLimiter(config: { requests: number; window: number }) {
  return async (key: string) => {
    const now = Date.now();
    let entry = memoryStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + config.window };
      memoryStore.set(key, entry);
    }

    entry.count++;
    const resetBefore = new Date(entry.resetTime);
    const resetInSeconds = Math.ceil(
      (entry.resetTime - now) / 1000
    );

    return {
      success: entry.count <= config.requests,
      remaining: Math.max(0, config.requests - entry.count),
      resetTime: resetBefore,
      resetInSeconds,
      resetIn: resetInSeconds, // Legacy compatibility
    };
  };
}

// Upstash-based limiters (if configured)
let upstashRedis: Redis | null = null;
let upstashLimiters: {
  strict?: Ratelimit;
  normal?: Ratelimit;
  public?: Ratelimit;
  cron?: Ratelimit;
} = {};

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  upstashRedis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  upstashLimiters = {
    strict: new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.fixedWindow(5, "60 s"),
    }),
    normal: new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.fixedWindow(30, "60 s"),
    }),
    public: new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.fixedWindow(100, "60 s"),
    }),
    cron: new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.fixedWindow(3, "60 s"),
    }),
  };
}

// Memory-based limiters (fallback)
const memoryLimiters = {
  strict: getMemoryLimiter(limiters.strict),
  normal: getMemoryLimiter(limiters.normal),
  public: getMemoryLimiter(limiters.public),
  cron: getMemoryLimiter(limiters.cron),
};

interface RateLimitResponse {
  success: boolean;
  remaining: number;
  resetTime?: Date;
  resetInSeconds?: number;
  resetIn?: number; // Legacy
  allowed?: boolean; // Legacy
}

/**
 * Check rate limit for a given key and limiter type
 * @param key - Unique identifier (usually IP + route)
 * @param limiterType - 'strict', 'normal', 'public', or 'cron'
 * @returns Rate limit status
 */
export async function checkRateLimit(
  key: string,
  limiterType: "strict" | "normal" | "public" | "cron" = "normal"
): Promise<RateLimitResponse> {
  try {
    if (upstashLimiters[limiterType as keyof typeof upstashLimiters]) {
      const limiter =
        upstashLimiters[limiterType as keyof typeof upstashLimiters]!;
      const result = await limiter.limit(key);

      return {
        success: result.success,
        remaining: result.remaining,
        resetTime: new Date(result.reset),
        resetInSeconds: Math.ceil((result.reset - Date.now()) / 1000),
        allowed: result.success, // Legacy
        resetIn: Math.ceil((result.reset - Date.now()) / 1000), // Legacy
      };
    }
  } catch (error) {
    console.error(
      "Upstash rate limit error, falling back to memory:",
      error
    );
  }

  // Fallback to memory-based limiter
  return await memoryLimiters[limiterType as keyof typeof memoryLimiters](key);
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

/**
 * Create a rate limit key from IP and pathname
 */
export function createRateLimitKey(ip: string, pathname: string): string {
  return `ratelimit:${ip}:${pathname}`;
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearRateLimitCache(): void {
  memoryStore.clear();
}
