import { z } from 'zod';
import places from './data/generated/dia_diem.json';
import prices from './data/generated/gia_tham_khao.json';
import { parseHours } from './hours';
import { store } from './store';
import { setLiveSources, type LiveSources } from './sources';
import type { SourceLine } from './schema';

// Who may feed information in: the tourism department (official), a business about itself, or a
// traveller. Nothing reaches a card until a reviewer approves it; approved lines keep the
// submitter's label and the approval date. "Report a mistake" uses the same queue.
export const SubmissionInput = z.object({
  kind: z.enum(['update', 'report']),
  role: z.enum(['chinh_thuc', 'doanh_nghiep', 'ca_nhan']),
  place_id: z.string().max(20).optional(), price_id: z.string().max(80).optional(),
  field: z.enum(['hours', 'price', 'closed', 'info', 'other']),
  value: z.string().max(200).optional(), note: z.string().max(500).optional(),
  organization: z.string().max(120).optional(), source_url: z.union([z.url({ protocol: /^https?$/ }).max(300), z.literal('')]).optional(),
});
export type Submission = z.infer<typeof SubmissionInput> & { id: string; name: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; reviewed_at?: string };

const placeName = (id?: string) => places.find(p => p.id === id)?.ten_vi;
const priceName = (id?: string) => prices.find(p => p.id === id || p.hang_muc === id)?.hang_muc;
export async function submit(input: z.infer<typeof SubmissionInput>): Promise<Submission | null> {
  const name = placeName(input.place_id) ?? priceName(input.price_id);
  if (!name) return null;
  if (input.field === 'hours' && input.value) { try { parseHours(input.value); } catch { return null; } }
  const item: Submission = { ...input, id: `s-${crypto.randomUUID().slice(0, 8)}`, name, status: 'pending', created_at: new Date().toISOString() };
  await store.hset('submissions', item.id, item);
  return item;
}
export async function listSubmissions(): Promise<Submission[]> { return Object.values(await store.hgetall<Submission>('submissions')).sort((a, b) => b.created_at.localeCompare(a.created_at)); }
export async function review(id: string, status: 'approved' | 'rejected'): Promise<Submission | null> {
  const item = await store.hget<Submission>('submissions', id);
  if (!item) return null;
  const next = { ...item, status, reviewed_at: new Date().toISOString() };
  await store.hset('submissions', id, next);
  cachedAt = 0;
  return next;
}

const FIELD_VI: Record<Submission['field'], string> = { hours: 'Giờ mở cửa', price: 'Giá', closed: 'Đã đóng cửa', info: 'Thông tin', other: 'Khác' };
const hoursText = (v: string) => v === 'daily 00:00-00:00' ? 'mở 24 giờ' : v.replace('daily ', 'hằng ngày ');
function line(s: Submission): SourceLine {
  const who = s.organization?.trim() || (s.role === 'ca_nhan' ? 'Du khách' : s.role === 'doanh_nghiep' ? 'Doanh nghiệp' : 'Sở Du lịch');
  const value = s.field === 'hours' && s.value ? hoursText(s.value) : s.value;
  const note = s.kind === 'report' ? `Du khách báo sai: ${FIELD_VI[s.field].toLowerCase()}${s.note ? `, “${s.note}”` : ''}. Đang kiểm lại.` : `${FIELD_VI[s.field]}: ${[value, s.note].filter(Boolean).join('. ')}`;
  return { label: s.role, source: s.source_url || `${who} (gửi qua Ask Saigon)`, checked_at: (s.reviewed_at ?? s.created_at).slice(0, 10), note };
}
// Approved submissions become extra source lines; approved hours replace weaker-labelled hours.
let cachedAt = 0;
export async function refreshLiveSources(maxAgeMs = 20000) {
  if (Date.now() - cachedAt < maxAgeMs) return;
  cachedAt = Date.now();
  const live: LiveSources = { lines: {}, hours: {} };
  for (const s of (await listSubmissions()).filter(s => s.status === 'approved').reverse()) {
    const id = s.place_id ?? prices.find(p => p.id === s.price_id || p.hang_muc === s.price_id)?.id;
    if (!id) continue;
    (live.lines[id] ??= []).push(line(s));
    if (s.kind === 'update' && s.field === 'hours' && s.value && s.place_id) live.hours[s.place_id] = { gio_mo: s.value, label: s.role };
  }
  setLiveSources(live);
}
