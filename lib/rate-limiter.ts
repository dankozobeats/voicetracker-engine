/**
 * In-Memory Rate Limiter
 *
 * Simple rate limiting implementation using sliding window algorithm.
 * For production with multiple server instances, consider using Redis.
 *
 * Usage:
 * ```typescript
 * import { rateLimiter } from '@/lib/rate-limiter';
 *
 * export async function GET(request: NextRequest) {
 *   const identifier = request.ip || 'anonymous';
 *   const limited = rateLimiter.check(identifier, 'api:transactions', 100); // 100 req/min
 *
 *   if (limited) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *   // ... rest of handler
 * }
 * ```
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null;

  constructor(windowMs = 60000) {
    // Default: 1 minute window
    this.store = new Map();
    this.windowMs = windowMs;
    this.cleanupInterval = null;

    // Cleanup expired entries every minute
    this.startCleanup();
  }

  /**
   * Check if request should be rate limited
   *
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param namespace - Route or endpoint namespace (e.g., 'api:transactions')
   * @param maxRequests - Maximum requests allowed in window
   * @returns true if rate limited, false otherwise
   */
  check(identifier: string, namespace: string, maxRequests: number): boolean {
    const key = `${namespace}:${identifier}`;
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return false;
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      return true; // Rate limited
    }

    return false; // Not rate limited
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, namespace: string, maxRequests: number): number {
    const key = `${namespace}:${identifier}`;
    const entry = this.store.get(key);

    if (!entry || Date.now() > entry.resetAt) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get reset time in seconds
   */
  getResetTime(identifier: string, namespace: string): number {
    const key = `${namespace}:${identifier}`;
    const entry = this.store.get(key);

    if (!entry || Date.now() > entry.resetAt) {
      return 0;
    }

    return Math.ceil((entry.resetAt - Date.now()) / 1000);
  }

  /**
   * Reset counter for identifier
   */
  reset(identifier: string, namespace: string): void {
    const key = `${namespace}:${identifier}`;
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = global.setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 60000); // Cleanup every minute

    // Don't prevent Node.js from exiting
    if (this.cleanupInterval && typeof this.cleanupInterval === 'object' && 'unref' in this.cleanupInterval) {
      (this.cleanupInterval as any).unref();
    }
  }

  /**
   * Stop cleanup interval (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Standard API endpoints (per minute)
  API_STANDARD: 100,

  // Expensive operations (projection calculations)
  API_EXPENSIVE: 20,

  // Read operations
  API_READ: 200,

  // Write operations
  API_WRITE: 50,

  // Auth operations (stricter)
  AUTH: 10,
} as const;

/**
 * Helper to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (behind proxy)
  const forwarded = (request.headers.get('x-forwarded-for') ?? '').split(',')[0];
  const realIp = request.headers.get('x-real-ip');

  // Fallback to connection remote address
  return forwarded || realIp || 'anonymous';
}

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  identifier: string,
  namespace: string,
  maxRequests: number
): Response {
  const remaining = rateLimiter.getRemaining(identifier, namespace, maxRequests);
  const resetTime = rateLimiter.getResetTime(identifier, namespace);

  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());

  return response;
}
