import { describe, expect, it, vi } from 'vitest';
import { AI_LIMITS, allowAi } from '../../lib/ratelimit';

const run = async (n: number, who: { ip: string; client?: string }, now: number) => { const out: boolean[] = []; for (let i = 0; i < n; i++) out.push(await allowAi(who, now)); return out; };

describe('rate limiting', () => {
  it('gives each browser its own budget, so one shared IP does not throttle a whole room', async () => {
    vi.stubEnv('AI_DAILY_CAP', '10000');
    const now = Date.parse('2026-11-18T03:00:00Z');
    expect((await run(AI_LIMITS.perBrowser, { ip: 'venue', client: 'browser-aaaa' }, now)).every(Boolean)).toBe(true);
    expect(await allowAi({ ip: 'venue', client: 'browser-aaaa' }, now)).toBe(false);
    expect(await allowAi({ ip: 'venue', client: 'browser-bbbb' }, now)).toBe(true);
    expect(await allowAi({ ip: 'venue', client: 'browser-aaaa' }, now + AI_LIMITS.windowMs)).toBe(true);
    vi.unstubAllEnvs();
  });
  it('caps one IP that rotates browser ids', async () => {
    vi.stubEnv('AI_DAILY_CAP', '10000');
    const now = Date.parse('2026-11-18T04:00:00Z');
    const results = await Promise.all(Array.from({ length: AI_LIMITS.perIp + 1 }, (_, i) => allowAi({ ip: 'script', client: `rotating-${String(i).padStart(4, '0')}` }, now)));
    expect(results.filter(Boolean)).toHaveLength(AI_LIMITS.perIp);
    vi.unstubAllEnvs();
  });
  it('keeps the old per-IP budget when a request has no browser id', async () => {
    vi.stubEnv('AI_DAILY_CAP', '10000');
    const now = Date.parse('2026-11-18T05:00:00Z');
    expect((await run(AI_LIMITS.withoutBrowserId, { ip: 'no-id' }, now)).every(Boolean)).toBe(true);
    expect(await allowAi({ ip: 'no-id' }, now)).toBe(false);
    vi.unstubAllEnvs();
  });
  it('enforces the global daily cap', async () => {
    vi.stubEnv('AI_DAILY_CAP', '1');
    const now = Date.parse('2026-10-31T01:00:00Z');
    expect(await allowAi({ ip: 'cap-a', client: 'browser-cap-a' }, now)).toBe(true);
    expect(await allowAi({ ip: 'cap-b', client: 'browser-cap-b' }, now)).toBe(false);
    expect(await allowAi({ ip: 'cap-b', client: 'browser-cap-b' }, now + 86400000)).toBe(true);
    vi.unstubAllEnvs();
  });
});
