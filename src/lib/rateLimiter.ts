import { createClient } from "redis";

type Bucket = { count: number; resetAt: number };

const buckets: Map<string, Bucket> = new Map();

type SimpleRedis = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean> | Promise<void>;
  ttl(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  set(key: string, value: string, opts?: { EX: number }): Promise<unknown>;
  connect(): Promise<void>;
};

let redisClient: SimpleRedis | null = null;
let redisInitializing = false;

function getRedisClient(): SimpleRedis | null {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisInitializing) return null; // avoid re-entrancy
  redisInitializing = true;
  try {
    const raw = createClient({ url });

    // Cast to minimal interface so TypeScript understands available methods
    const client = raw as unknown as SimpleRedis;
    // Connect asynchronously but don't await here; callers will tolerate short delay
    client
      .connect()
      .catch((err: unknown) => console.warn("Failed to connect to Redis for rate limiter:", err));

    redisClient = client;
    return redisClient;
  } finally {
    redisInitializing = false;
  }
}

/**
 * Rate-limiter: if REDIS_URL is set we use Redis INCR+EXPIRE for global limits.
 * Otherwise we fall back to an in-memory Map suitable for single-process dev.
 */
export async function checkRateLimit(key: string, limit = 10, windowSeconds = 60) {
  const client = getRedisClient();
  const windowSecondsNum = Number(windowSeconds);
  if (client) {
    try {
      const redisKey = `rate:${key}`;
      const current = await client.incr(redisKey);
      if (current === 1) {
        await client.expire(redisKey, windowSecondsNum);
      }
      const remaining = Math.max(0, limit - current);
      const ttl = await client.ttl(redisKey);
      const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowSecondsNum * 1000);
      return { allowed: current <= limit, remaining, resetAt };
    } catch (err) {
      // On Redis error, fall back to in-memory limiter
      console.warn("Redis rate limiter error, falling back to in-memory", err);
    }
  }

  // In-memory fallback (same behaviour as before)
  const now = Date.now();
  const windowMs = windowSecondsNum * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

// For introspection / testability in dev
export function getBucket(key: string) {
  return buckets.get(key) ?? null;
}

// Optionally expose a cleanup (not strict) to avoid memory leaks in long-running dev
export function pruneBuckets(olderThanMs = 1000 * 60 * 60) {
  const now = Date.now();
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt + olderThanMs < now) buckets.delete(k);
  }
}

// JTI revocation helpers (use Redis when available)
export async function isJtiRevoked(jti: string) {
  const client = getRedisClient();
  if (!client) return false; // no revocation store in dev
  try {
    const key = `revoked_jti:${jti}`;
    const exists = await client.exists(key);
    return exists === 1;
  } catch (err) {
    console.warn("Error checking jti revocation", err);
    return false;
  }
}

export async function revokeJti(jti: string, ttlSeconds = 60 * 60) {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const key = `revoked_jti:${jti}`;
    await client.set(key, "1", { EX: ttlSeconds });
    return true;
  } catch (err) {
    console.warn("Error revoking jti", err);
    return false;
  }
}

// Remove a revoked jti (un-revoke). Returns true if removed or false on error.
export async function unrevokeJti(jti: string) {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const key = `revoked_jti:${jti}`;
    // Prefer DEL if available on client, guard via unknown cast
    const anyClient = client as unknown as Record<string, unknown>;
    if (typeof anyClient.del === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (anyClient.del as any)(key);
      return true;
    }
    // Fallback: set TTL to 1 so it expires immediately
    await client.expire(key, 1);
    return true;
  } catch (err) {
    console.warn("Error unreving jti", err);
    return false;
  }
}

// List revoked JTIs with remaining TTL (seconds). Returns empty array if no redis or on error.
/**
 * List revoked JTIs with optional pagination using Redis SCAN or KEYS fallback.
 * If start/limit are provided we return slice (offset pagination). If filterAction/actor
 * are provided we scan the whole set and filter before paging.
 */
export async function listRevokedJtis(opts?: {
  start?: number;
  limit?: number;
  // reserved for future server-side filters
}): Promise<{ items: Array<{ jti: string; ttl: number }>; total: number }> {
  const client = getRedisClient();
  if (!client) return { items: [], total: 0 };
  const start = typeof opts?.start === "number" && opts.start >= 0 ? opts.start : 0;
  const limit = typeof opts?.limit === "number" && opts.limit > 0 ? opts.limit : 100;

  try {
    const anyClient = client as unknown as Record<string, unknown>;

    // If client supports scanIterator (redis@v4) use it to iterate keys safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (anyClient as any).scanIterator === "function") {
      // collect into an array then slice
      // Limit the maximum we fetch to avoid unbounded memory; but we expect revoked set to be modest
      const collected: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const key of (anyClient as any).scanIterator({
        MATCH: "revoked_jti:*",
        COUNT: 100,
      })) {
        collected.push(String(key));
      }

      const total = collected.length;
      const slice = collected.slice(start, start + limit);
      const out: Array<{ jti: string; ttl: number }> = [];
      for (const key of slice) {
        const ttl = await client.ttl(key).catch(() => -1);
        const jti = key.replace(/^revoked_jti:/, "");
        out.push({ jti, ttl });
      }
      return { items: out, total };
    }

    // Fallback: if KEYS available, use it
    if (typeof anyClient.keys === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keys: string[] = await (anyClient.keys as any)("revoked_jti:*");
      const total = keys.length;
      const slice = keys.slice(start, start + limit);
      const out: Array<{ jti: string; ttl: number }> = [];
      for (const key of slice) {
        const ttl = await client.ttl(key).catch(() => -1);
        const jti = key.replace(/^revoked_jti:/, "");
        out.push({ jti, ttl });
      }
      return { items: out, total };
    }

    return { items: [], total: 0 };
  } catch (err) {
    console.warn("Error listing revoked jtis", err);
    return { items: [], total: 0 };
  }
}

// Audit log helpers: store recent audit events in Redis list 'revocation_audit'
export type RevocationAuditEvent = {
  when: number; // epoch ms
  action: "revoke" | "unrevoke";
  jti: string;
  ttlSeconds?: number | null;
  actor?: string | null; // email or 'api-key'
  note?: string | null;
};

export async function appendRevocationAudit(event: RevocationAuditEvent) {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const key = "revocation_audit";
    const payload = JSON.stringify(event);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyClient = client as unknown as Record<string, any>;
    if (typeof anyClient.lpush === "function") {
      await anyClient.lpush(key, payload);
      // Keep only recent 1000 entries
      if (typeof anyClient.ltrim === "function") {
        await anyClient.ltrim(key, 0, 999);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Error appending revocation audit", err);
    return false;
  }
}

export async function listRevocationAudit(limit = 100): Promise<RevocationAuditEvent[]> {
  const client = getRedisClient();
  if (!client) return [];
  try {
    const key = "revocation_audit";
    const anyClient = client as unknown as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (anyClient as any).lrange === "function") {
      // lrange 0..limit-1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: string[] = await (anyClient as any).lrange(key, 0, Math.max(0, limit - 1));
      return items
        .map((s) => {
          try {
            return JSON.parse(s) as RevocationAuditEvent;
          } catch {
            return null as unknown as RevocationAuditEvent;
          }
        })
        .filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn("Error reading revocation audit", err);
    return [];
  }
}
