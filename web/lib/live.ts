import type { SourceLine } from './schema';

// Facts that change daily, read from the publisher at question time instead of stored in the CSVs:
// Vietcombank's published exchange rates and the shows Lune Production lists at the Saigon Opera
// House. Each answer carries the page it came from and when it was read. Results are cached briefly
// (Vietcombank asks for at most one request every 5 minutes) and a failed read says so plainly.

export type LiveInfo = { found: true; kind: 'exchange_rate' | 'opera_shows'; title: string; lines: string[]; source: SourceLine } | { found: false; kind: string; reason: string };

const cache = new Map<string, { at: number; value: LiveInfo }>();
async function cached(key: string, ttlMs: number, load: () => Promise<LiveInfo>): Promise<LiveInfo> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await load();
  // A failure is kept for one minute only, so a short outage doesn't hide good data for long.
  cache.set(key, { at: value.found ? Date.now() : Date.now() - ttlMs + 60000, value });
  return value;
}
const fetchText = async (url: string) => { const r = await fetch(url, { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AskSaigon/1.0)' } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); };
const vnDate = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

const VCB = 'https://www.vietcombank.com.vn/api/exchangerates?date=now';
const VCB_PAGE = 'https://www.vietcombank.com.vn/vi-VN/KHCN/Cong-cu-Tien-ich/Ty-gia';
type VcbRow = { currencyCode: string; currencyName: string; cash: string; transfer: string; sell: string };

export async function exchangeRates(currencies: string[] = ['USD', 'EUR'], lang: 'en' | 'vi' = 'en'): Promise<LiveInfo> {
  const all = await cached('vcb', 600000, async () => {
    try {
      const data = JSON.parse(await fetchText(VCB)) as { UpdatedDate?: string; Data?: VcbRow[] };
      if (!data.Data?.length) return { found: false, kind: 'exchange_rate', reason: 'no rates published' };
      const updated = data.UpdatedDate ?? new Date().toISOString();
      return { found: true, kind: 'exchange_rate', title: updated, lines: data.Data.map(r => JSON.stringify(r)), source: { label: 'doanh_nghiep', source: VCB_PAGE, checked_at: updated.slice(0, 10) } };
    } catch { return { found: false, kind: 'exchange_rate', reason: 'Vietcombank rates could not be read right now' }; }
  });
  if (!all.found) return all;
  const wanted = new Set(currencies.map(c => c.toUpperCase()));
  const rows = all.lines.map(l => JSON.parse(l) as VcbRow).filter(r => wanted.has(r.currencyCode));
  if (!rows.length) return { found: false, kind: 'exchange_rate', reason: `Vietcombank publishes no rate for ${[...wanted].join(', ')}` };
  const n = (v: string) => Math.round(Number(v)).toLocaleString('vi-VN');
  const time = all.title.slice(11, 16);
  return {
    ...all,
    title: lang === 'vi' ? `Tỷ giá Vietcombank, cập nhật ${time} ${vnDate(all.title)}` : `Vietcombank rates, updated ${time} ${vnDate(all.title)}`,
    lines: rows.map(r => lang === 'vi' ? `1 ${r.currencyCode}: mua tiền mặt ${n(r.cash)} ₫, mua chuyển khoản ${n(r.transfer)} ₫, bán ${n(r.sell)} ₫` : `1 ${r.currencyCode}: bank buys cash at ${n(r.cash)} ₫, transfer ${n(r.transfer)} ₫, sells at ${n(r.sell)} ₫`),
  };
}

const LUNE = 'https://www.luneproduction.com/';
// The listing renders as: show link (?from_date=…) → show name → "From Date dd/mm/yyyy" → venue link.
const SHOW = /href="\/([a-z0-9-]+)\?location_id=\d+&amp;from_date=[^"]+"[\s\S]{0,300}?<p[^>]*>([^<]+)<\/p><p[^>]*>From Date(?:<!-- -->|\s)*([\d/]+)<\/p>[\s\S]{0,500}?<a[^>]*href="\/([a-z0-9-]+)"[^>]*><p[^>]*>([^<]+)<\/p>/g;

export async function operaShows(lang: 'en' | 'vi' = 'en'): Promise<LiveInfo> {
  return cached(`lune:${lang}`, 1800000, async () => {
    try {
      const html = await fetchText(LUNE);
      const shows = new Map<string, { name: string; from: string }>();
      for (const m of html.matchAll(SHOW)) if (m[4] === 'saigon-opera-house') shows.set(m[1], { name: m[2].trim(), from: m[3] });
      if (!shows.size) return { found: false, kind: 'opera_shows', reason: 'no Saigon Opera House show is listed by Lune Production right now' };
      const now = new Date().toISOString();
      return {
        found: true, kind: 'opera_shows',
        title: lang === 'vi' ? 'Show tại Nhà hát Thành phố (Lune Production)' : 'Shows at the Saigon Opera House (Lune Production)',
        lines: [...shows.values()].map(s => lang === 'vi' ? `${s.name}: suất gần nhất từ ${s.from}; giờ diễn và vé xem trên trang Lune` : `${s.name}: next performances from ${s.from}; times and tickets on Lune's site`),
        source: { label: 'doanh_nghiep', source: LUNE, checked_at: now.slice(0, 10) },
      };
    } catch { return { found: false, kind: 'opera_shows', reason: 'the show listing could not be read right now' }; }
  });
}
