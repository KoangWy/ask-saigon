import type { Block, ChatRequest, Reply } from './schema';
import { travelEstimate, type Coordinates } from './geo';
import { normalizeText, outsideArea, replyLanguage } from './agent/language';
import { sanitizeReplyText } from './agent/format';
import { eveningPlaces, getPriceReference, planItinerary, placesNamedIn, priceRowFor, searchPlaces } from './tools';
import { routeIntent } from './routes';

// Questions whose answer is fully decided by the checked data skip the model: food and coffee
// searches, "near me" or "near <place>", and the quick buttons. They get the same cards the AI
// path would build with the same tools, in well under a second, and spend none of the AI budget.
// Anything else (free questions, plans with preferences, prices, TikTok, photos) still goes to the model.
const FOOD = /\b(quan an|an gi|an sang|an trua|an toi|an dem|an khuya|an vat|do an|mon an|food|eat|eating|hungry|restaurants?|breakfast|lunch|dinner|pho|bun cha|bun thit nuong|bun bo|banh mi|banh xeo|banh cuon|com tam|hu tieu|banh canh|bun rieu|xoi|che|oc|quan lau|an lau|lau bo|hot ?pot|chay|vegetarian|vegan|doi bung)\b/;
const COFFEE = /\b(ca phe|cafe|coffee)\b/;
const NEAR = /\b(gan day|gan toi|gan minh|quanh day|xung quanh|near me|nearby|around here|near|gan)\b/;
const OTHER = /\b(plan|itinerary|lich trinh|len lich|gia|price|bao nhieu|hop ly|fair|cost|tiktok|menu|thuc don|dich|translate)\b/;
const PRICE = /\b(price|prices|fair|cost|costs|how much|expensive|cheap|overpriced|rip ?off|ripped off|worth it|gia|hop ly|bao nhieu|dat|re|mac|chat chem|chem)\b/;
const TRAVEL = /\b(di bo|bao lau|bao xa|mat bao|how long|how far|walk|walking|get to|get from|di den|di toi|di sang|di qua|taxi|grab|xe om|duong di|chi duong|directions?|khoang cach|distance)\b|\btu\b.+\b(den|toi|qua|sang)\b|\bfrom\b.+\bto\b/;
const EVENING = /\b(toi nay|buoi toi|ve dem|ban dem|dem nay|choi dem|nightlife|night life|tonight|this evening|in the evening|at night|night out|after dark)\b/;
const OUTING = /\b(di dau|di choi|choi gi|choi o dau|lam gi|tham quan|what to do|things to do|where to go|where should i go|places to visit|sightseeing)\b/;
export const priceIntent = (text: string) => PRICE.test(normalizeText(text));
// "Tham quan Dinh Độc Lập mất bao lâu?" asks how long a visit takes, not how long the trip is.
const VISIT = /\b(tham quan|visit|visiting|spend|o lai|xem het)\b/;
// "Phố đi bộ" is a place name, not a walk.
export const travelIntent = (text: string) => { const q = normalizeText(text).replace(/\bpho di bo\b/g, ' '); return TRAVEL.test(q) && !VISIT.test(q); };
const OPEN_NOW = /\b(dang mo|con mo|open now)\b/;
type Ctx = { location: Coordinates; now: Date; lang: 'en' | 'vi' };

export function fastAnswer(request: ChatRequest, ctx: Ctx, base: (text: string) => Reply): Reply | null {
  const { input } = request, vi = ctx.lang === 'vi';
  if (input.kind === 'quick') {
    if (input.quick === 'plan') {
      const plan = planItinerary({ budget_k: request.state.budget_cap }, ctx);
      if (!plan.days.some(d => d.stops.length)) return null;
      const r = base(vi ? 'Đây là lịch trình đề xuất cho hôm nay, xếp theo giờ mở cửa đã kiểm.' : 'Here is a suggested plan for today, built around checked opening times.');
      r.blocks.push({ type: 'itinerary', ...plan });
      r.quick_replies = vi ? ['Trời mưa', 'Chia sẻ với nhóm'] : ["It's raining", 'Share with group'];
      return r;
    }
    const places = searchPlaces(input.quick === 'hungry' ? { categories: ['quan_an'] } : input.quick === 'tired' ? { categories: ['ca_phe', 'trong_nha'] } : {}, ctx);
    if (!places.length) return null;
    const r = base(input.quick === 'hungry' ? (vi ? 'Đây là vài quán ăn gần bạn.' : 'Here are a few places to eat near you.') : input.quick === 'tired' ? (vi ? 'Đây là vài chỗ nghỉ chân gần bạn: cà phê và nơi trong nhà.' : 'Here are a few places to rest near you: cafés and indoor spots.') : (vi ? 'Đây là một vài lựa chọn gần bạn.' : 'Here are a few nearby options.'));
    r.blocks.push({ type: 'place_cards', places });
    return r;
  }
  if (input.kind !== 'text') return null;
  const text = input.text, q = normalizeText(text);
  if (/https?:\/\//i.test(text) || OTHER.test(q) || routeIntent(text)) return null;
  const food = FOOD.test(q), coffee = COFFEE.test(q), near = NEAR.test(q);
  // "Tối nay đi đâu chơi?" is decided by the data too: night spots and places open at 20:00 tonight.
  if (!food && !coffee && (EVENING.test(q) || OUTING.test(q)) && q.split(/\s+/).filter(Boolean).length <= 10) {
    const evening = EVENING.test(q);
    const places = evening ? eveningPlaces(ctx) : searchPlaces({ categories: ['di_tich', 'trong_nha', 'diem_dem'], open_now: true, radius_m: 2500, limit: 4 }, ctx);
    if (places.length) {
      const r = base(evening ? (vi ? 'Buổi tối bạn có thể đi những nơi này: phố đêm trước, rồi những chỗ còn mở lúc 20:00 theo giờ đã kiểm.' : 'For the evening: night spots first, then places still open at 20:00 by their checked hours.')
        : (vi ? 'Đây là vài nơi tham quan đang mở gần bạn.' : 'Here are a few sights open now near you.'));
      r.blocks.push({ type: 'place_cards', places });
      r.quick_replies = vi ? ['Lên lịch một ngày', 'Đói bụng'] : ['Plan my day', "I'm hungry"];
      return r;
    }
  }
  if (!food && !coffee && !near) return null;
  // A bare "what is near me" is decided by the data; a described wish ("a quiet place to read") is for the model.
  if (!food && !coffee && !placesNamedIn(text, ctx).length && q.split(/\s+/).filter(Boolean).length > 6) return null;
  // "near Dinh Độc Lập" searches around that place instead of the traveller.
  const anchor = near ? placesNamedIn(text, ctx)[0] : undefined;
  const where = anchor ? { ...ctx, location: { lat: anchor.lat, lng: anchor.lng } } : ctx;
  const places = searchPlaces({
    ...(food || coffee ? { query: text, categories: [food ? 'quan_an' : 'ca_phe'] } : {}),
    ...(/\b(chay|vegetarian|vegan)\b/.test(q) ? { tags: ['chay'] } : {}),
    ...(OPEN_NOW.test(q) ? { open_now: true } : {}),
  }, where);
  const r = base(!places.length ? (vi ? 'Mình chưa thấy địa điểm phù hợp trong dữ liệu đã kiểm. Bạn thử hỏi cách khác nhé?' : "I couldn't find a matching place in the checked data. Try asking another way?")
    : anchor ? (vi ? `Đây là vài lựa chọn gần ${anchor.name}.` : `Here are a few options near ${anchor.name}.`)
    : near ? (vi ? 'Đây là một vài lựa chọn gần bạn.' : 'Here are a few nearby options.')
    : (vi ? 'Đây là các địa điểm phù hợp trong dữ liệu đã kiểm, gần nhất trước.' : 'Here are matching places from the checked data, nearest first.'));
  if (places.length) r.blocks.push({ type: 'place_cards', places });
  return r;
}

// "Xích lô 500k một tiếng có đắt không?": the item comes from the reference price table, the amount
// and duration from the question, the verdict from code. No model, so the answer is the same every time.
const COUNT: Record<string, number> = { mot: 1, hai: 2, ba: 3, one: 1, two: 2, three: 3, nua: 0.5, half: 0.5, an: 1 };
export function parsePriceQuery(text: string): { item: string; amount: number; quantity: number; assumeUnit: boolean } | null {
  const normalized = normalizeText(text);
  const row = priceRowFor(normalized);
  // "Xích lô 300k" alone is a price check too.
  if (!PRICE.test(normalized) && normalized.split(/\s+/).filter(Boolean).length > 4) return null;
  // Per-km and minimum fares depend on the trip length: travelAnswer estimates those.
  if (!row || row.don_vi.includes('km')) return null;
  const money = normalized.match(/\b(\d[\d.,]*)\s*(k|thousand|nghin|ngan|tr|trieu|million|000|vnd|dong|d)\b/) ?? normalized.match(/\b(\d{4,}|\d{1,3}(?:[.,]\d{3})+)\b()/);
  if (!money) return null;
  const suffix = money[2];
  const amount = ['k', 'thousand', 'nghin', 'ngan'].includes(suffix) ? Number(money[1].replace(',', '.')) * 1000
    : ['tr', 'trieu', 'million'].includes(suffix) ? Number(money[1].replace(',', '.')) * 1000000 : Number(money[1].replace(/[.,]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const hourly = row.don_vi === 'hour';
  const unit = normalized.match(/\b(\d+(?:[.,]\d+)?|mot|hai|ba|one|two|three|nua|half|an)\s*(hours?|hrs?|h|gio|tieng)\b/);
  const quantity = hourly && unit ? (COUNT[unit[1]] ?? Number(unit[1].replace(',', '.'))) : 1;
  return { item: row.hang_muc, amount, quantity, assumeUnit: hourly && !unit };
}
export function priceAnswer(request: ChatRequest, source: Reply['source'] = 'rules'): Reply | null {
  const sample = request.input.kind === 'sample' && request.input.sample_id === 'price-cyclo';
  const query = parsePriceQuery(sample ? 'cyclo 300000 vnd one hour fair' : request.input.kind === 'text' ? request.input.text : '');
  if (!query) return null;
  const lang = replyLanguage(request), vi = lang === 'vi';
  const price = getPriceReference({ item: query.item, user_price_vnd: query.amount, quantity: query.quantity }, lang);
  if (!price.found || !('verdict' in price)) return null;
  const block: Block = { type: 'price_check', ...price };
  const verdict = price.verdict === 'fair' ? (vi ? 'nằm trong khoảng tham khảo.' : 'is within the reference range.')
    : price.verdict === 'a_bit_high' ? (vi ? 'hơi cao so với tham khảo.' : 'is a bit high.')
    : (vi ? 'cao hơn nhiều so với tham khảo.' : 'is much higher than the reference.');
  const amount = query.amount >= 1000000 ? `${(query.amount / 1000000).toLocaleString(vi ? 'vi-VN' : 'en-US')} ${vi ? 'triệu' : 'million'}` : `${Math.round(query.amount / 1000)}k`;
  const assumption = query.assumeUnit ? (vi ? 'Giả sử một giờ, ' : 'Assuming one hour, ') : '';
  const text = `${assumption}${amount} ${vi ? `cho ${price.item}` : `for ${price.item}`} ${verdict}`;
  return { reply_text: sanitizeReplyText(text, [block]), blocks: [block], quick_replies: vi ? ['Gần đây', 'Lên lịch một ngày'] : ['Nearby', 'Plan my day'], simulated: false, fallback: false, source };
}

// "Từ Dinh Độc Lập đi bộ tới Nhà thờ Đức Bà mất bao lâu?": distance and time from the coordinates,
// a taxi range from the checked per-km fare. One named place means from where the traveller is.
export function travelAnswer(request: ChatRequest, ctx: Ctx, base: (text: string) => Reply): Reply | null {
  const { input } = request;
  if (input.kind !== 'text' || outsideArea(input.text)) return null;
  const q = normalizeText(input.text);
  if (!travelIntent(input.text) || routeIntent(input.text)) return null;
  const named = placesNamedIn(input.text, ctx, 'mentioned');
  if (!named.length) return null;
  // "Từ <a place we don't know> tới X": one end is missing, so this is not ours to estimate.
  if (named.length === 1 && /\b(tu|from)\b/.test(q) && !/\b(tu (day|cho toi|cho minh|khach san)|from (here|my|the hotel))\b/.test(q)) return null;
  const vi = ctx.lang === 'vi';
  const [from, to] = named.length >= 2 ? [{ name: named[0].name, lat: named[0].lat, lng: named[0].lng }, named[1]] : [{ name: request.state.location.source === 'gps' ? (vi ? 'chỗ bạn đang đứng' : 'where you are') : request.state.location.label, ...ctx.location }, named[0]];
  const leg = travelEstimate(from, to), walk = Math.max(1, Math.round(leg.distance_m / 80));
  const distance = leg.distance_m < 1000 ? `${Math.round(leg.distance_m / 10) * 10} m` : `${(leg.distance_m / 1000).toLocaleString(vi ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 })} km`;
  const taxi = getPriceReference({ item: 'taxi' }, ctx.lang), wantsTaxi = /\b(taxi|grab|xe om|xe|car|ride)\b/.test(q);
  const perKm = taxi.found ? (vi ? `${String(taxi.reference_min).replace('.', ',')}–${String(taxi.reference_max).replace('.', ',')} nghìn/km` : `${taxi.reference_min}–${taxi.reference_max}k VND/km`) : '';
  const ride = leg.distance_m >= 1000 || wantsTaxi ? Math.ceil(5 + leg.distance_m / 333) : 0;
  // A per-km rate says little about a ride under a kilometre, so the estimate starts at 1 km.
  const fare = taxi.found && leg.distance_m >= 1000 && (wantsTaxi || leg.mode === 'driving') ? [taxi.reference_min, taxi.reference_max].map(v => Math.round(v * leg.distance_m / 1000)) : null;
  const short = taxi.found && wantsTaxi && !fare ? (vi ? `; quãng ngắn nên đi bộ là nhanh nhất, taxi tính ${perKm} theo giá đã kiểm` : `; it is short enough to walk, taxis charge ${perKm} at the checked fare`) : '';
  const text = leg.distance_m < 150
    ? (vi ? `${to.name} ở ngay cạnh ${from.name}, chỉ vài bước chân.` : `${to.name} is right next to ${from.name}, a few steps away.`)
    : vi
      ? `Từ ${from.name} đến ${to.name} khoảng ${distance}: đi bộ chừng ${walk} phút${ride && !short ? `, đi xe khoảng ${ride} phút` : ''}${fare ? `, taxi ước ${fare[0]}–${fare[1]} nghìn đồng theo giá ${perKm} đã kiểm` : short}. Đây là ước tính theo khoảng cách; bấm “Chỉ đường” để xem đường đi thật.`
      : `From ${from.name} to ${to.name} is about ${distance}: roughly a ${walk}-minute walk${ride && !short ? `, about ${ride} minutes by car` : ''}${fare ? `, a taxi around ${fare[0]}–${fare[1]}k VND at the checked ${perKm} fare` : short}. This is an estimate from distance; tap Directions for the real route.`;
  const closed = to.status === 'temporarily_closed' ? (vi ? ` Lưu ý: ${to.name} đang tạm đóng với khách tham quan, xem thẻ bên dưới.` : ` Note: ${to.name} is temporarily closed to visitors, see the card below.`) : '';
  const r = base(text + closed);
  r.blocks.push({ type: 'place_cards', places: [to] });
  return r;
}
