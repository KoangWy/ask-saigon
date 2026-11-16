import { store } from './store';
import type { ChatRequest, Reply } from './schema';

// Anonymous demand counts for the tourism department and partners: what kind of question, at
// what hour, and which places were suggested. No question text, IP or browser id is stored.
export const TOPICS = ['places', 'price', 'plan', 'tiktok', 'menu', 'routes', 'story', 'replan', 'chat'] as const;
const topicOf = (reply: Reply) => {
  const type = reply.blocks[0]?.type;
  return type === 'place_cards' ? 'places' : type === 'price_check' ? 'price' : type === 'itinerary' ? 'plan' : type === 'tiktok_result' ? 'tiktok' : type === 'menu_translation' ? 'menu' : type === 'route_cards' ? 'routes' : type === 'story' ? 'story' : type === 'replan' || type === 'group_vote' || type === 'budget' ? 'replan' : 'chat';
};
const day = (now: Date) => new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
const scopes = (partner?: string) => ['all', ...(partner && /^[a-z0-9-]{2,40}$/.test(partner) ? [`p:${partner}`] : [])];

export async function recordChat(request: ChatRequest, reply: Reply, now = new Date()) {
  const hour = String(new Date(now.getTime() + 7 * 3600000).getUTCHours()).padStart(2, '0');
  const placeIds = [...new Set(reply.blocks.flatMap(b => b.type === 'place_cards' ? b.places.map(p => p.id) : b.type === 'tiktok_result' && b.place ? [b.place.id] : []))];
  const keys = scopes(request.partner).map(scope => `stats:${scope}:${day(now)}`);
  const fields = ['total', `topic:${topicOf(reply)}`, `hour:${hour}`, ...placeIds.map(id => `place:${id}`)];
  await store.hincrMany(keys.flatMap(key => fields.map(field => ({ key, field }))), keys.map(key => ({ key, seconds: 120 * 86400 })));
}
export type DemandStats = { days: string[]; total: number; topics: Record<string, number>; hours: number[]; places: Record<string, number>; perDay: Record<string, number> };
export async function readStats(partner: string | undefined, days = 7, now = new Date()): Promise<DemandStats> {
  const scope = scopes(partner).at(-1)!;
  const list = Array.from({ length: days }, (_, i) => day(new Date(now.getTime() - i * 86400000))).reverse();
  const out: DemandStats = { days: list, total: 0, topics: {}, hours: Array(24).fill(0), places: {}, perDay: {} };
  const hashes = await store.hgetallMany<number>(list.map(d => `stats:${scope}:${d}`));
  for (const [i, d] of list.entries()) {
    const h = hashes[i];
    out.perDay[d] = Number(h.total ?? 0); out.total += out.perDay[d];
    for (const [k, v] of Object.entries(h)) {
      const n = Number(v);
      if (k.startsWith('topic:')) out.topics[k.slice(6)] = (out.topics[k.slice(6)] ?? 0) + n;
      else if (k.startsWith('hour:')) out.hours[Number(k.slice(5))] += n;
      else if (k.startsWith('place:')) out.places[k.slice(6)] = (out.places[k.slice(6)] ?? 0) + n;
    }
  }
  return out;
}
