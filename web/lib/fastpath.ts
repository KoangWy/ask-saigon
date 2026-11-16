import type { ChatRequest, Reply } from './schema';
import type { Coordinates } from './geo';
import { normalizeText } from './agent/language';
import { planItinerary, placesNamedIn, searchPlaces } from './tools';
import { routeIntent } from './routes';

// Questions whose answer is fully decided by the checked data skip the model: food and coffee
// searches, "near me" or "near <place>", and the quick buttons. They get the same cards the AI
// path would build with the same tools, in well under a second, and spend none of the AI budget.
// Anything else (free questions, plans with preferences, prices, TikTok, photos) still goes to the model.
const FOOD = /\b(quan an|an gi|an sang|an trua|an toi|an dem|an khuya|an vat|do an|mon an|food|eat|eating|hungry|restaurants?|breakfast|lunch|dinner|pho|bun cha|bun thit nuong|bun bo|banh mi|banh xeo|banh cuon|com tam|hu tieu|chay|vegetarian|vegan|doi bung)\b/;
const COFFEE = /\b(ca phe|cafe|coffee)\b/;
const NEAR = /\b(gan day|gan toi|gan minh|quanh day|xung quanh|near me|nearby|around here|near|gan)\b/;
const OTHER = /\b(plan|itinerary|lich trinh|len lich|gia|price|bao nhieu|hop ly|fair|cost|tiktok|menu|thuc don|dich|translate)\b/;
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
