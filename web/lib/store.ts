import { Redis } from '@upstash/redis';

// Small key-value surface for contributions, routes, ratings and anonymous counts.
// Production uses Upstash Redis (env set by the Vercel integration); without it, e.g. in tests,
// values live in process memory and disappear on restart.
export interface Store {
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  hincr(key: string, field: string, by?: number): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
}

class MemoryStore implements Store {
  private data = new Map<string, Map<string, unknown>>();
  private hash(key: string) { let h = this.data.get(key); if (!h) { h = new Map(); this.data.set(key, h); } return h; }
  async hget<T>(key: string, field: string) { return (this.data.get(key)?.get(field) as T | undefined) ?? null; }
  async hset(key: string, field: string, value: unknown) { this.hash(key).set(field, structuredClone(value)); }
  async hgetall<T>(key: string) { return Object.fromEntries(this.data.get(key) ?? []) as Record<string, T>; }
  async hincr(key: string, field: string, by = 1) { const h = this.hash(key); h.set(field, Number(h.get(field) ?? 0) + by); }
  async expire() {}
}

class RedisStore implements Store {
  constructor(private redis: Redis) {}
  async hget<T>(key: string, field: string) { return (await this.redis.hget<T>(key, field)) ?? null; }
  async hset(key: string, field: string, value: unknown) { await this.redis.hset(key, { [field]: value }); }
  async hgetall<T>(key: string) { return ((await this.redis.hgetall<Record<string, T>>(key)) ?? {}) as Record<string, T>; }
  async hincr(key: string, field: string, by = 1) { await this.redis.hincrby(key, field, by); }
  async expire(key: string, seconds: number) { await this.redis.expire(key, seconds); }
}

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const persistent = !!(url && token);
export const store: Store = persistent ? new RedisStore(new Redis({ url: url!, token: token! })) : new MemoryStore();
