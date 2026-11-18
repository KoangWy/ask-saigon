import type { Block, Place } from '../schema';
import rows from '../data/generated/dia_diem.json';

const byId = new Map(rows.map(r => [r.id, r]));

// The model needs ids and checked facts for its reply, not card-only fields (sources, maps,
// photos, coordinates). Trim those before sending a tool result back, so every later round pays
// less prefill. The full objects still feed the real blocks in index.ts.
function about(id: string, lang: 'en' | 'vi') {
  const r = byId.get(id);
  if (!r) return {};
  const text = (lang === 'vi' ? r.mo_ta_vi || r.mo_ta_en : r.mo_ta_en || r.mo_ta_vi).trim();
  return { ...(text ? { about: text } : {}), has_story: !!(r.cau_chuyen_vi || r.cau_chuyen_en) };
}

export function compactToolResult(name: string, result: unknown, lang: 'en' | 'vi' = 'en'): unknown {
  const place = (p: unknown): unknown => {
    if (!p || typeof p !== 'object' || !('id' in p) || !('category' in p)) return p;
    const q = p as Place;
    return {
      id: q.id, name: q.name, category: q.category, district: q.district,
      open_now: q.open_now, closes_at: q.closes_at, price_range: q.price_range,
      ...(q.distance_m != null ? { distance_m: q.distance_m } : {}),
      ...(q.status ? { status: q.status, status_note: q.status_note } : {}),
      source: q.source, checked_at: q.checked_at,
      // A one-line description and whether a checked story exists let the model answer "what is it
      // like / tell me about it" without another round for details or a story that isn't there.
      ...about(q.id, lang),
    };
  };
  if (Array.isArray(result)) return result.map(place);
  if (!result || typeof result !== 'object') return result;
  const r = result as Record<string, unknown>;
  if ('place' in r) return { ...r, place: place(r.place) };
  if (name === 'find_routes' && Array.isArray(r.routes)) {
    return { ...r, routes: (r.routes as Record<string, unknown>[]).map(route => ({
      id: route.id, title: route.title, summary: route.summary, modes: route.modes,
      green: route.green, rating: route.rating,
      stops: (route.stops as { name?: string }[] | undefined)?.map(s => s.name),
    })) };
  }
  return r;
}

function cardDetails(blocks: Block[]): string[] {
  return blocks.flatMap(block => {
    if (block.type !== 'place_cards') return [];
    return block.places.flatMap(place => {
      const distance = place.distance_m === null ? '' : place.distance_m >= 1000
        ? `${(place.distance_m / 1000).toFixed(1)} km`
        : `${place.distance_m} m`;
      // Opening/closing times are left out: a direct "it closes at 22:00" is a useful answer to a
      // follow-up, while addresses, sources and hours notes are card-only facts we must not echo.
      return [place.address, place.source, place.checked_at, place.hours_note, distance]
        .filter(value => value && value.length >= 4);
    });
  });
}

export function sanitizeReplyText(value: string, blocks: Block[] = []): string {
  const text = value
    .replace(/```[\s\S]*?```/g, match => match.replace(/```/g, ''))
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, '$1')
    .replace(/[*_`~#>]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/https?:\/\/[^\s)]+/gi, '')
    // History markers are internal plumbing; a small model sometimes echoes them into its reply.
    .replace(/\[showed places:[^\]]*\]/gi, '')
    // Bare domains go (the source is on the card), but not capitalised abbreviations like "TP.HCM".
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?/gi, match => /[A-Z]/.test(match) && !match.includes('/') ? match : '')
    .replace(/\(\s*(?:source\s*)?\)/gi, '')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  const details = cardDetails(blocks).map(detail => detail.toLocaleLowerCase());
  const hasPlaceCards = blocks.some(block => block.type === 'place_cards');
  const protectedText = text.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|e\.g|i\.e)\./gi, match => match.replaceAll('.', '\u2024')).replace(/(?<=\d)\.(?=\d)/g, '\u2024').replace(/(?<=\p{Lu})\.(?=\p{Lu})/gu, '\u2024');
  const fragments = (protectedText.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).map(fragment => fragment.replaceAll('\u2024', '.'));
  const sentences = fragments
    .map(sentence => sentence.trim())
    .filter(sentence => sentence && !/^(?:source|sources|ngu[oő]n|checked|ki[eể]m)\s*:?\s*$/i.test(sentence))
    // A short sentence that only restates the card ("It is open now.", "About 300 m away.") goes; a longer
    // one that uses the fact to say something ("open now and two minutes away, so go first") stays.
    .filter(sentence => sentence && (!hasPlaceCards || /\b(source|sources|address)\b/i.test(sentence) === false || sentence.length > 200) && (!hasPlaceCards || sentence.length > 60 || !/\b(opening hours|hours checked|hours not verified|distance|open now|closed now)\b/i.test(sentence)))
    .filter(sentence => !hasPlaceCards || sentence.length > 60 || !/\b\d+(?:[.,]\d+)?\s*(?:km|m|meters?|metres?)\b/i.test(sentence))
    .filter(sentence => {
      const lower = sentence.toLocaleLowerCase();
      return !details.some(detail => lower.includes(detail));
    })
    .slice(0, 4);

  // The filters above drop sentences that repeat card details; if that leaves nothing but a question
  // ("Want details on either?"), the reply has lost its point, so keep the model's own sentences.
  if (!sentences.some(sentence => !/\?\s*$/.test(sentence))) return fragments.map(f => f.trim()).filter(Boolean).slice(0, 4).join(' ');
  return sentences.join(' ');
}

// The agent's ways of saying the checked data has no answer (see the prompt's OUT OF SCOPE rule).
const NOT_IN_DATA = /(không có trong dữ liệu|chưa có trong dữ liệu|chưa có .{0,40}(đã kiểm|trong dữ liệu)|chưa nằm trong dữ liệu|không nằm trong dữ liệu|not in my checked|isn't in my|aren't in my|don't have .{0,40}(checked|verified|data)|no checked|not something in my|not in the checked)/i;
export const saysNotInData = (text: string) => NOT_IN_DATA.test(text);
