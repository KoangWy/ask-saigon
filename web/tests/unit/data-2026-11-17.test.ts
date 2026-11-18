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
    expect(await names('Quán ốc nào ngon?')).toEqual(expect.arrayContaining(['Ốc Đào']));
    expect(await names('Hủ tiếu Nam Vang ở đâu ngon?')).toEqual(expect.arrayContaining(['Hủ tiếu Nam Vang Hồng Phát']));
    expect(await names('Quán lẩu gần đây')).toEqual(expect.arrayContaining(['Lẩu bò Tí Chuột']));
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

describe('updates checked on 17/11/2026', () => {
  const reply = (text: string) => routeChat(request(text), 'update');
  it('says the cathedral is closed to visitors for restoration, with the date it was checked', async () => {
    const r = await reply('Nhà thờ Đức Bà mở cửa mấy giờ?');
    expect(r.reply_text).toMatch(/^Nhà thờ Đức Bà Sài Gòn đang tạm đóng với khách tham quan\. Đang đại trùng tu, dự kiến xong cuối năm 2027.*\(cập nhật 17\/11\/2026\)$/);
    const card = r.blocks.flatMap(b => b.type === 'place_cards' ? b.places : [])[0];
    expect(card).toMatchObject({ status: 'temporarily_closed', open_now: false, status_checked_at: '2026-11-17' });
    const trip = await reply('Từ Dinh Độc Lập đi bộ tới Nhà thờ Đức Bà mất bao lâu?');
    expect(trip.reply_text).toContain('đang tạm đóng với khách tham quan');
  });
  it('leaves the cathedral out of suggestions and plans', async () => {
    vi.stubEnv('AI_MODE', 'off');
    expect(await names('Hôm nay đi đâu chơi?')).not.toContain('Nhà thờ Đức Bà Sài Gòn');
    const plan = planItinerary({ start: '08:00' }, { location: { lat: 10.7798, lng: 106.699 }, now: new Date('2026-11-18T01:00:00Z'), lang: 'vi' });
    expect(plan.days[0].stops.map(s => s.place_id)).not.toContain('q1-006');
    vi.unstubAllEnvs();
  });
  it('uses the museum fees in force from 1/10/2026', async () => {
    expect((await reply('Vé Bảo tàng Chứng tích Chiến tranh bao nhiêu?')).reply_text).toContain('Vé người lớn 60 nghìn đồng');
    expect((await reply('Bảo tàng Mỹ thuật vé bao nhiêu?')).reply_text).toContain('Vé người lớn 60 nghìn đồng');
    expect((await reply('Bảo tàng Thành phố mở cửa mấy giờ?')).reply_text).toContain('Vé người lớn 60 nghìn đồng');
    expect((await reply('Bảo tàng Tôn Đức Thắng có mất phí không?')).reply_text).toContain('Vào cửa miễn phí');
  });
  it('reads “Phố đi bộ” as a place, not a walk', async () => {
    expect((await reply('Phố đi bộ Nguyễn Huệ mở cửa không?')).reply_text).toMatch(/^Phố đi bộ Nguyễn Huệ: mở 24 giờ/);
  });
});
