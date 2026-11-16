import { z } from 'zod';
import { refreshLiveSources } from './contributions';
import { getPriceReference, placesNamedIn, planItinerary, searchPlaces } from './tools';
import { findRoute, listRoutes, routeItinerary } from './routes';

// The four reads behind /api/v1. Every place and price keeps its labelled source lines and
// checked dates, the same as the cards in the chat.
const coords = (q: URLSearchParams) => {
  const lat = Number(q.get('lat') ?? 10.7724), lng = Number(q.get('lng') ?? 106.698);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('lat and lng must be numbers');
  return { lat, lng };
};
const lang = (q: URLSearchParams) => (q.get('lang') === 'en' ? 'en' : 'vi') as 'en' | 'vi';
const ctx = (q: URLSearchParams) => ({ location: coords(q), now: new Date(), lang: lang(q) });

export async function places(q: URLSearchParams) {
  await refreshLiveSources();
  const text = (q.get('q') ?? '').slice(0, 200), category = q.get('category') ?? undefined;
  if (category && !['quan_an', 'ca_phe', 'di_tich', 'diem_dem', 'trong_nha'].includes(category)) throw new Error('unknown category');
  const named = text ? placesNamedIn(text, ctx(q)) : [];
  const found = named.length ? named : searchPlaces({ ...(text ? { query: text } : {}), ...(category ? { categories: [category] } : {}), ...(q.get('open_now') === 'true' ? { open_now: true } : {}), radius_m: Math.min(5000, Number(q.get('radius_m')) || 1500), limit: Math.min(5, Number(q.get('limit')) || 3) }, ctx(q));
  return { places: found };
}
export async function prices(q: URLSearchParams) {
  await refreshLiveSources();
  const item = z.string().min(2).max(80).parse(q.get('item'));
  const offered = q.get('price_vnd') ? Number(q.get('price_vnd')) : undefined;
  const result = getPriceReference({ item, user_price_vnd: offered, quantity: Number(q.get('quantity')) || 1 }, lang(q));
  return result.found ? { price: result } : { price: null, note: 'No checked reference price for this item yet.' };
}
export async function routes(q: URLSearchParams) { return { routes: await listRoutes(lang(q)) }; }
export async function itinerary(q: URLSearchParams) {
  const id = q.get('route');
  if (id) { const route = await findRoute(id, lang(q)); if (!route) throw new Error('unknown route'); return { itinerary: routeItinerary(route, new Date()) }; }
  const budget = q.get('budget_k') ? Number(q.get('budget_k')) : undefined;
  return { itinerary: planItinerary({ ...(budget ? { budget_k: budget } : {}), ...(q.get('start') && /^\d{2}:\d{2}$/.test(q.get('start')!) ? { start: q.get('start')! } : {}) }, ctx(q)) };
}
