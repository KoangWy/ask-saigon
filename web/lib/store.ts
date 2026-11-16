import { Redis } from '@upstash/redis';

// Small key-value surface for contributions, routes, ratings, rate limits and anonymous counts.
// Production uses Upstash Redis (env set by the Vercel integration); without it, e.g. in tests,
// values live in process memory and disappear on restart. The *Many methods send one pipelined
// request so a chat reply costs a single round trip to Redis.
export interface Store {
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  hgetallMany<T>(keys: string[]): Promise<Record<string, T>[]>;
  hincrMany(ops: { key: string; field: string; by?: number }[], ttl?: { key: string; seconds: number }[]): Promise<void>;
  // Increments each counter, sets its expiry, and returns the new values in order.
  incrMany(counters: { key: string; seconds: number }[]): Promise<number[]>;
}

class MemoryStore implements Store {
  private data = new Map<string, Map<string, unknown>>();
  private counters = new Map<string, { value: number; until: number }>();
  private hash(key: string) { let h = this.data.get(key); if (!h) { h = new Map(); this.data.set(key, h); } return h; }
  async hget<T>(key: string, field: string) { return (this.data.get(key)?.get(field) as T | undefined) ?? null; }
  async hset(key: string, field: string, value: unknown) { this.hash(key).set(field, structuredClone(value)); }
  async hgetall<T>(key: string) { return Object.fromEntries(this.data.get(key) ?? []) as Record<string, T>; }
  async hgetallMany<T>(keys: string[]) { return Promise.all(keys.map(k => this.hgetall<T>(k))); }
  async hincrMany(ops: { key: string; field: string; by?: number }[]) { for (const { key, field, by = 1 } of ops) { const h = this.hash(key); h.set(field, Number(h.get(field) ?? 0) + by); } }
  async incrMany(counters: { key: string; seconds: number }[]) {
    const now = Date.now();
    return counters.map(({ key, seconds }) => {
      const c = this.counters.get(key);
      const next = c && c.until > now ? { value: c.value + 1, until: c.until } : { value: 1, until: now + seconds * 1000 };
      this.counters.set(key, next);
      return next.value;
    });
  }
}

class RedisStore implements Store {
  constructor(private redis: Redis) {}
  async hget<T>(key: string, field: string) { return (await this.redis.hget<T>(key, field)) ?? null; }
  async hset(key: string, field: string, value: unknown) { await this.redis.hset(key, { [field]: value }); }
  async hgetall<T>(key: string) { return ((await this.redis.hgetall<Record<string, T>>(key)) ?? {}) as Record<string, T>; }
  async hgetallMany<T>(keys: string[]) {
    if (!keys.length) return [];
    const p = this.redis.pipeline();
    for (const k of keys) p.hgetall(k);
    return ((await p.exec()) as (Record<string, T> | null)[]).map(h => h ?? {});
  }
  async hincrMany(ops: { key: string; field: string; by?: number }[], ttl: { key: string; seconds: number }[] = []) {
    if (!ops.length) return;
    const p = this.redis.pipeline();
    for (const { key, field, by = 1 } of ops) p.hincrby(key, field, by);
    for (const { key, seconds } of ttl) p.expire(key, seconds);
    await p.exec();
  }
  async incrMany(counters: { key: string; seconds: number }[]) {
    const p = this.redis.pipeline();
    for (const { key, seconds } of counters) { p.incr(key); p.expire(key, seconds); }
    const out = (await p.exec()) as number[];
    return counters.map((_, i) => Number(out[i * 2]));
  }
}

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const persistent = !!(url && token);
export const store: Store = persistent ? new RedisStore(new Redis({ url: url!, token: token! })) : new MemoryStore();
