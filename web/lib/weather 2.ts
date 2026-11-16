// Rain forecast for central Ho Chi Minh City from Open-Meteo (free, no key), cached for 15 minutes.
// A day plan uses it to move open-air stops out of the rain, the same rule as the simulated shower.
type Forecast = { times: string[]; probability: number[]; precipitation: number[] };
export type RainWindow = { date: string; start: string; end: string; probability: number; source: string; checked_at: string };
const URL = 'https://api.open-meteo.com/v1/forecast?latitude=10.7769&longitude=106.7009&hourly=precipitation_probability,precipitation&timezone=Asia%2FHo_Chi_Minh&forecast_days=2';
let cache: { at: number; data: Forecast } | null = null;

async function forecast(): Promise<Forecast | null> {
  if (cache && Date.now() - cache.at < 900000) return cache.data;
  try {
    const response = await fetch(URL, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const json = await response.json();
    const data = { times: json.hourly.time, probability: json.hourly.precipitation_probability, precipitation: json.hourly.precipitation };
    cache = { at: Date.now(), data };
    return data;
  } catch { return null; }
}
// First stretch in the next `hours` hours where rain is likely (probability or measurable rain).
export function findRain(f: Forecast, now: Date, threshold = 60, hours = 12): RainWindow | null {
  const local = new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 13);
  const from = f.times.findIndex(t => t.slice(0, 13) === local);
  if (from < 0) return null;
  const wet = (i: number) => (f.probability[i] ?? 0) >= threshold || (f.precipitation[i] ?? 0) >= 1;
  let start = -1;
  for (let i = from; i < Math.min(f.times.length, from + hours); i++) if (wet(i)) { start = i; break; }
  if (start < 0) return null;
  let end = start;
  while (end + 1 < f.times.length && wet(end + 1) && f.times[end + 1].slice(0, 10) === f.times[start].slice(0, 10)) end++;
  const hour = (i: number) => f.times[i].slice(11, 16);
  return { date: f.times[start].slice(0, 10), start: hour(start), end: end + 1 < f.times.length && f.times[end + 1].slice(0, 10) === f.times[start].slice(0, 10) ? hour(end + 1) : '23:59', probability: Math.max(...f.probability.slice(start, end + 1)), source: 'Open-Meteo', checked_at: now.toISOString() };
}
export async function rainWindow(now = new Date()): Promise<{ rain: RainWindow | null; available: boolean }> {
  const f = await forecast();
  return { rain: f ? findRain(f, now) : null, available: !!f };
}
