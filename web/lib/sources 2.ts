import extra from './data/generated/nguon_bo_sung.json';
import type { SourceLabel, SourceLine } from './schema';

// Each fact keeps the label of whoever supplied it. When sources disagree the official one wins,
// then the business itself, then a traveller, then third-party guides.
export const LABEL_RANK: Record<SourceLabel, number> = { chinh_thuc: 0, doanh_nghiep: 1, ca_nhan: 2, tham_khao: 3 };
export type LiveSources = { lines: Record<string, SourceLine[]>; hours: Record<string, { gio_mo: string; label: SourceLabel }> };
let live: LiveSources = { lines: {}, hours: {} };
// Approved contributions from the store; refreshed by the API routes before they answer.
export function setLiveSources(next: LiveSources) { live = next; }
export function liveHours(id: string) { return live.hours[id]; }
export function sourceLines(id: string, primary: SourceLine, lang: 'en' | 'vi'): SourceLine[] {
  const lines: SourceLine[] = [primary, ...extra.filter(e => e.id === id).map(e => ({ label: e.nhan as SourceLabel, source: e.nguon, checked_at: e.ngay_kiem, note: lang === 'vi' ? e.xac_nhan_vi : e.xac_nhan_en })), ...(live.lines[id] ?? [])];
  return lines.map((line, i) => ({ line, i })).sort((a, b) => LABEL_RANK[a.line.label] - LABEL_RANK[b.line.label] || a.i - b.i).map(x => x.line);
}
// A line checked more than 60 days ago is shown as needing a recheck.
export function isStale(checkedAt: string, now: Date, days = 60): boolean { const t = Date.parse(checkedAt); return Number.isFinite(t) && now.getTime() - t > days * 86400000; }
