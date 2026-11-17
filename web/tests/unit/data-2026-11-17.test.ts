import { describe, expect, it, vi } from 'vitest';
import { routeChat } from '../../lib/router';
import { planItinerary } from '../../lib/tools';
import places from '../../lib/data/generated/dia_diem.json';
import type { ChatRequest } from '../../lib/schema';

// Places, hours and prices added on 17/11/2026 (sources in data/SOURCES.md).
const request = (text: string): ChatRequest => ({ input: { kind: 'text', text }, history: [], state: { lang: 'vi', location: { lat: 10.7797, lng: 106.6893, label: 'SIHUB', source: 'picked' }, now: '2026-11-18T03:45:00.000Z', offline: false }, client_id: 'data-test' });
const names = async (text: string) => (await routeChat(request(text), 'data')).blocks.flatMap(b => b.type === 'place_cards' ? b.places.map(p => p.name) : []);

describe('the enriched data', () => {
  it('finds vegetarian places and dishes the first seed did not have', async () => {
    vi.stubEnv('AI_MODE', 'off');
    expect(await names('Có quán chay nào gần đây không?')).toEqual(expect.arrayContaining(['Chay Garden Võ Văn Tần']));
    expect(await names('Quán ốc nào ngon?')).toEqual(['Ốc Đào']);
    expect(await names('Hủ tiếu Nam Vang ở đâu ngon?')).toEqual(['Hủ tiếu Nam Vang Hồng Phát']);
    expect(await names('Quán lẩu gần đây')).toEqual(['Lẩu bò Tí Chuột']);
    vi.unstubAllEnvs();
  });
  it('reads multi-range museum hours in words', async () => {
    const reply = await routeChat(request('Bảo tàng Lịch sử mở cửa mấy giờ?'), 'data');
    expect(reply.reply_text).toContain('mở thứ 3–CN 08:00–11:30, 13:00–17:00; thứ 2 nghỉ');
  });
  it('keeps a day plan to meals at meal times, one café and one mall', () => {
    const plan = planItinerary({ budget_k: 800, start: '09:00' }, { location: { lat: 10.7724, lng: 106.698 }, now: new Date('2026-11-18T02:00:00Z'), lang: 'vi' });
    const rows = plan.days[0].stops.map(s => ({ ...s, row: places.find(p => p.id === s.place_id)! }));
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(rows.filter(s => s.row.loai === 'quan_an').every(s => (toMin(s.arrive) >= 690 && toMin(s.arrive) <= 780) || (toMin(s.arrive) >= 1080 && toMin(s.arrive) <= 1200))).toBe(true);
    expect(rows.filter(s => s.row.loai === 'ca_phe').length).toBeLessThanOrEqual(1);
    expect(rows.filter(s => s.row.tag.includes('mua_sam')).length).toBeLessThanOrEqual(1);
  });
});
