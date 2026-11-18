import { store } from './store';

// Live AI answers cost money. Each browser (the anonymous id the app keeps in localStorage) gets
// its own budget, so a room of judges on one Wi-Fi is not throttled together. The per-IP ceiling
// only stops scripts that rotate browser ids, and the daily cap protects the key. Counters live in
// the store, so every server instance sees the same numbers.
// Raised on 18/11/2026 once Mistral (fast, cheap per turn) became the first provider; each can be
// tuned per deployment with AI_PER_BROWSER / AI_PER_IP / AI_DAILY_CAP without a code change.
const envInt = (name: string, fallback: number) => { const n = Number(process.env[name]); return Number.isFinite(n) && n > 0 ? n : fallback; };
export const AI_LIMITS = { get perBrowser() { return envInt('AI_PER_BROWSER', 40); }, get perIp() { return envInt('AI_PER_IP', 300); }, withoutBrowserId: 30, windowMs: 600000 };
export async function allowAi({ ip, client }: { ip: string; client?: string }, now = Date.now()): Promise<boolean> {
  const window = Math.floor(now / AI_LIMITS.windowMs), day = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
  const id = client && /^[A-Za-z0-9-]{8,64}$/.test(client) ? client : null;
  try {
    const [perIp, perDay, perBrowser] = await store.incrMany([
      { key: `rl:ip:${ip}:${window}`, seconds: 660 },
      { key: `rl:day:${day}`, seconds: 90000 },
      ...(id ? [{ key: `rl:c:${id}:${window}`, seconds: 660 }] : []),
    ]);
    if (perDay > envInt('AI_DAILY_CAP', 1000)) return false;
    return id ? perBrowser <= AI_LIMITS.perBrowser && perIp <= AI_LIMITS.perIp : perIp <= AI_LIMITS.withoutBrowserId;
  } catch {
    return true; // the store is unreachable: answer rather than fail, the provider still has its own limits
  }
}
