import type { ToolName } from './tools';

// Progress lines shown while the agent works, like a coding agent's tool log: one line per tool
// call ("Đang tìm địa điểm: phở" → "Tìm thấy 3 địa điểm"). Labels come from code, never from the
// model, so a TikTok caption or menu text can't put words in this line. Arguments are clipped.
// lang is the reply's language, which can differ from the page's (a Vietnamese question on the EN page).
export type AgentStep = { id: string; label: string; status: 'running' | 'done' | 'error'; summary?: string; ephemeral?: boolean; lang?: Lang };

type Lang = 'en' | 'vi';
const clip = (value: unknown, max = 40) => { const s = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''; return s.length > max ? `${s.slice(0, max - 1)}…` : s; };
const withArg = (base: string, arg: string) => arg ? `${base}: ${arg}` : base;

export function stepLabel(name: string, args: Record<string, unknown>, lang: Lang): string {
  const vi = lang === 'vi';
  switch (name as ToolName) {
    case 'search_places': return withArg(vi ? 'Đang tìm địa điểm' : 'Searching places', clip(args.query));
    case 'check_place_live': return withArg(vi ? 'Đang kiểm tra địa điểm' : 'Checking the place', clip(args.name));
    case 'read_tiktok': return vi ? 'Đang đọc video TikTok' : 'Reading the TikTok video';
    case 'get_price_reference': return withArg(vi ? 'Đang tra giá tham khảo' : 'Looking up reference prices', clip(args.item));
    case 'plan_itinerary': return vi ? 'Đang xếp lịch trình theo giờ mở cửa' : 'Building a plan around opening hours';
    case 'get_story': return vi ? 'Đang mở câu chuyện của địa điểm' : 'Opening the story of the place';
    case 'show_menu_translation': return vi ? 'Đang dịch thực đơn' : 'Translating the menu';
    case 'get_place_details': return vi ? 'Đang xem chi tiết địa điểm' : 'Reading place details';
    case 'get_weather': return vi ? 'Đang xem dự báo mưa' : 'Checking the rain forecast';
    case 'get_live_info': return args.kind === 'opera_shows' ? (vi ? 'Đang xem lịch diễn Nhà hát Thành phố' : 'Checking Opera House shows') : (vi ? 'Đang lấy tỷ giá Vietcombank' : 'Fetching Vietcombank exchange rates');
    case 'get_travel_tips': return withArg(vi ? 'Đang tra mẹo du lịch đã kiểm' : 'Looking up checked travel tips', clip(args.query));
    case 'find_routes': return withArg(vi ? 'Đang tìm lộ trình cộng đồng' : 'Finding community routes', clip(args.query));
    case 'travel_estimate': { const from = clip(args.from, 24), to = clip(args.to, 24); return from && to ? `${vi ? 'Đang tính đường đi' : 'Estimating the trip'}: ${from} → ${to}` : (vi ? 'Đang tính đường đi' : 'Estimating the trip'); }
    default: return vi ? 'Đang tra cứu' : 'Looking it up';
  }
}

const count = (n: number, vi: boolean, one: string, many: string, viNoun: string) => vi ? `${n} ${viNoun}` : `${n} ${n === 1 ? one : many}`;

// One short result line per finished call; undefined keeps just the label with a check mark.
export function stepSummary(name: string, result: unknown, lang: Lang): string | undefined {
  const vi = lang === 'vi';
  const r = (result ?? {}) as Record<string, unknown>;
  switch (name as ToolName) {
    case 'search_places': { const n = Array.isArray(result) ? result.length : 0; return n ? `${vi ? 'Tìm thấy' : 'Found'} ${count(n, vi, 'place', 'places', 'địa điểm')}` : (vi ? 'Không có địa điểm phù hợp' : 'No matching place'); }
    case 'check_place_live': return r.found ? (r.place as { name?: string } | null)?.name : (vi ? 'Không có trong dữ liệu đã kiểm' : 'Not in the checked data');
    case 'read_tiktok': return r.error ? (vi ? 'Không đọc được video' : 'Could not read the video') : undefined;
    case 'get_price_reference': return r.found ? undefined : (vi ? 'Chưa có giá đã kiểm' : 'No checked price');
    case 'plan_itinerary': { const stops = ((r.days as { stops: unknown[] }[] | undefined) ?? []).reduce((n, d) => n + d.stops.length, 0); return stops ? count(stops, vi, 'stop', 'stops', 'điểm dừng') : (vi ? 'Chưa xếp được lịch' : 'No plan possible'); }
    case 'get_story': return result ? undefined : (vi ? 'Chưa có câu chuyện đã kiểm' : 'No checked story');
    case 'show_menu_translation': { const n = (r.items as unknown[] | undefined)?.length ?? 0; return n ? count(n, vi, 'dish', 'dishes', 'món') : undefined; }
    case 'get_place_details': return r.found ? (r.place as { name?: string }).name : (vi ? 'Không tìm thấy' : 'Not found');
    case 'get_weather': { const w = r as { available?: boolean; rain?: { start: string; end: string } | null }; return !w.available ? (vi ? 'Chưa có dự báo' : 'Forecast unavailable') : w.rain ? (vi ? `Có thể mưa ${w.rain.start}–${w.rain.end}` : `Rain likely ${w.rain.start}–${w.rain.end}`) : (vi ? 'Không thấy mưa trong 12 giờ tới' : 'No rain in the next 12 hours'); }
    case 'get_live_info': return r.found ? (r.title as string) : (vi ? 'Không đọc được nguồn lúc này' : 'Source unavailable right now');
    case 'get_travel_tips': { const n = (r.tips as unknown[] | undefined)?.length ?? 0; return n ? count(n, vi, 'tip', 'tips', 'mẹo') : (vi ? 'Chưa có mẹo đã kiểm' : 'No checked tip'); }
    case 'find_routes': { const n = typeof r.count === 'number' ? r.count : 0; return n ? count(n, vi, 'route', 'routes', 'lộ trình') : (vi ? 'Chưa có lộ trình phù hợp' : 'No matching route'); }
    case 'travel_estimate': return r.found === false ? (vi ? 'Không xác định được điểm đi/đến' : 'Could not resolve the places') : undefined;
    default: return undefined;
  }
}

// A finished line reads in the past tense, like a coding agent's log: "Đang tìm…" → "Đã tìm…".
const PAST: Record<string, string> = { Searching: 'Searched', Checking: 'Checked', Reading: 'Read', 'Looking up': 'Looked up', Building: 'Built', Opening: 'Opened', Translating: 'Translated', Finding: 'Found', Estimating: 'Estimated', Fetching: 'Fetched' };
export function doneLabel(label: string): string {
  if (label.startsWith('Đang ')) return `Đã ${label.slice(5)}`;
  const verb = Object.keys(PAST).find(v => label.startsWith(`${v} `));
  return verb ? PAST[verb] + label.slice(verb.length) : label;
}

// Shown between a tool round and the model's next words, then dropped once it starts writing.
export const thinkingLabel = (lang: Lang) => lang === 'vi' ? 'Đang tổng hợp kết quả' : 'Putting it together';
