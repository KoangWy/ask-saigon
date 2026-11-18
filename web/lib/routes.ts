import seed from '../data/lo_trinh.json';
import places from './data/generated/dia_diem.json';
import { travelEstimate } from './geo';
import { normalizeText } from './agent/language';
import { store } from './store';
import type { Itinerary, Route } from './schema';

// Routes travellers post: an ordered list of verified places. Seed routes ship with the data;
// posted routes and star ratings live in the store. A posted route stays "pending" until a
// reviewer approves it, and only its author (by browser id) sees it before that.
type Lang = 'en' | 'vi';
export type StoredRoute = { id: string; author: string; title: string; summary: string; modes: Route['modes']; stops: { place_id: string; note?: string }[]; created_at: string; status: Route['status']; owner?: string };
const GREEN = new Set(['metro', 'bus', 'walk', 'bike']);
const row = (id: string) => places.find(p => p.id === id);

export function seedRoutes(lang: Lang): StoredRoute[] {
  return seed.map(r => ({ id: r.id, author: r.author, title: lang === 'vi' ? r.title_vi : r.title_en, summary: lang === 'vi' ? r.summary_vi : r.summary_en, modes: r.modes as Route['modes'], stops: r.stops.map(s => ({ place_id: s.place_id, note: lang === 'vi' ? s.note_vi : s.note_en })), created_at: r.created_at, status: 'published' as const }));
}
function toRoute(r: StoredRoute, lang: Lang, rating: Route['rating']): Route {
  const stops = r.stops.flatMap(s => { const p = row(s.place_id); return p ? [{ place_id: p.id, name: lang === 'vi' ? p.ten_vi : p.ten_en, ...(s.note ? { note: s.note } : {}) }] : []; });
  return { id: r.id, title: r.title, author: r.author, summary: r.summary, stops, modes: r.modes, green: r.modes.length > 0 && r.modes.every(m => GREEN.has(m)), rating, status: r.status, created_at: r.created_at };
}
function rating(hash: Record<string, number>): Route['rating'] {
  const votes = Object.values(hash).map(Number).filter(n => n >= 1 && n <= 5);
  return { average: votes.length ? Math.round((votes.reduce((a, b) => a + b, 0) / votes.length) * 10) / 10 : null, count: votes.length };
}
export async function routeRating(id: string): Promise<Route['rating']> { return rating(await store.hgetall<number>(`ratings:${id}`)); }
// Well-rated routes with many ratings rise; an unrated route starts at a neutral 4 stars.
const score = (r: Route) => (((r.rating.average ?? 0) * r.rating.count) + 4 * 3) / (r.rating.count + 3);
export async function listRoutes(lang: Lang, owner?: string): Promise<Route[]> {
  const posted = Object.values(await store.hgetall<StoredRoute>('routes')).filter(r => r.status === 'published' || (owner && r.owner === owner));
  const all = [...seedRoutes(lang), ...posted];
  const ratings = await store.hgetallMany<number>(all.map(r => `ratings:${r.id}`));
  const routes = all.map((r, i) => toRoute(r, lang, rating(ratings[i])));
  return routes.sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || score(b) - score(a) || b.created_at.localeCompare(a.created_at));
}
export async function findRoute(id: string, lang: Lang, owner?: string): Promise<Route | null> { return (await listRoutes(lang, owner)).find(r => r.id === id) ?? null; }

const ROUTE_INTENT = /\b(lo trinh|route|routes|di bui|du lich bui|backpack|backpacking|lang thang|metro|du lich xanh|green trip|walking tour|tour di bo)\b/;
export function routeIntent(text: string): boolean { const q = normalizeText(text); return ROUTE_INTENT.test(q) && !/\b(gia|price|bao nhieu|fare|ticket|tickets|mua ve|buy|may gio|gio chay|chay den|hours?|time|schedule)\b/.test(q); }
export function matchRoutes(text: string, routes: Route[]): Route[] {
  const q = normalizeText(text);
  const words = q.split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !['lo', 'trinh', 'route', 'cho', 'toi', 'mot', 'ngay', 'the', 'and', 'with', 'bang', 'nao', 'goi', 'suggest'].includes(w));
  const modeWords: Record<string, string> = { metro: 'metro tau dien', walk: 'di bo walk walking chan', bus: 'xe buyt bus', bike: 'xe dap bike' };
  const ranked = routes.map(r => {
    const hay = normalizeText(`${r.title} ${r.summary} ${r.author} ${r.stops.map(s => s.name).join(' ')} ${r.modes.map(m => modeWords[m] ?? m).join(' ')}${r.green ? ' xanh green' : ''}${/11|dem|night|khuya/.test(normalizeText(r.title)) ? ' dem khuya night late' : ''}`);
    return { r, hits: words.filter(w => hay.includes(w)).length };
  });
  const hits = ranked.filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits || score(b.r) - score(a.r)).map(x => x.r);
  return (hits.length ? hits : routes).slice(0, 3);
}

// Follow a route in its own order. Walking and transit routes keep every leg on foot.
export function routeItinerary(route: Route, now: Date): Itinerary {
  const local = new Date(now.getTime() + 7 * 3600000), date = local.toISOString().slice(0, 10);
  let time = Math.ceil((local.getUTCHours() * 60 + local.getUTCMinutes()) / 5) * 5;
  const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const onFoot = !route.modes.some(m => m === 'car' || m === 'motorbike');
  const stops: Itinerary['days'][number]['stops'] = [], legs: Itinerary['days'][number]['legs'] = [];
  let previous: NonNullable<ReturnType<typeof row>> | undefined, total = 0;
  for (const s of route.stops) {
    const p = row(s.place_id); if (!p) continue;
    if (previous) {
      const leg = travelEstimate({ lat: +previous.lat, lng: +previous.lng }, { lat: +p.lat, lng: +p.lng });
      const minutes = onFoot ? Math.ceil(leg.distance_m / 80) : leg.minutes;
      legs.push({ from: previous.id, to: p.id, mode: onFoot ? 'walking' : leg.mode, minutes, distance_m: leg.distance_m, estimated: true });
      time += minutes;
    }
    const cost = p.gia_tu && p.gia_den ? (+p.gia_tu + +p.gia_den) / 2 : 0;
    stops.push({ place_id: p.id, name: s.name, arrive: clock(time), leave: clock(time + Number(p.thoi_gian_tham_quan)), est_cost: cost });
    time += Number(p.thoi_gian_tham_quan); total += cost; previous = p;
  }
  return { date, days: [{ date, stops, legs }], total_cost: total, budget: null };
}

export async function rateRoute(id: string, client: string, stars: number) { await store.hset(`ratings:${id}`, client, Math.max(1, Math.min(5, Math.round(stars)))); return routeRating(id); }
export async function postRoute(input: { author: string; title: string; summary: string; modes: Route['modes']; stops: { place_id: string; note?: string }[]; owner: string }): Promise<StoredRoute> {
  const route: StoredRoute = { ...input, id: `r-${crypto.randomUUID().slice(0, 8)}`, stops: input.stops.filter(s => row(s.place_id)), created_at: new Date().toISOString().slice(0, 10), status: 'pending' };
  await store.hset('routes', route.id, route);
  return route;
}
