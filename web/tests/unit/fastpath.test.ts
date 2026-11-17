import { afterEach, describe, expect, it, vi } from 'vitest';
import { routeChat } from '../../lib/router';
import type { ChatRequest } from '../../lib/schema';

const now = '2026-11-18T03:45:00.000Z';
const request = (input: ChatRequest['input']): ChatRequest => ({ input, history: [], state: { lang: 'vi', location: { lat: 10.7724, lng: 106.698, label: 'Bến Thành', source: 'picked' }, now, offline: false }, client_id: 'fast-path-test' });
const places = (r: Awaited<ReturnType<typeof routeChat>>) => r.blocks.flatMap(b => b.type === 'place_cards' ? b.places : []);

describe('answers decided by the data skip the model', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  const withModel = () => { vi.stubEnv('AI_MODE', 'on'); vi.stubEnv('LLM_API_KEY', 'test-key'); const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); return fetchMock; };

  it('answers the late phở question without calling the model', async () => {
    const fetchMock = withModel();
    const reply = await routeChat(request({ kind: 'text', text: 'Gần đây có quán phở nào mở khuya không?' }), 'fast');
    expect(places(reply).map(p => p.name)).toEqual(['Phở Quỳnh']);
    expect(reply.fallback).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('searches around a named place', async () => {
    withModel();
    const reply = await routeChat(request({ kind: 'text', text: 'Quán ăn gần Dinh Độc Lập' }), 'fast');
    expect(reply.reply_text).toBe('Đây là vài lựa chọn gần Dinh Độc Lập.');
    expect(places(reply).every(p => p.category === 'quan_an' && (p.distance_m ?? 0) <= 1500)).toBe(true);
  });
  it('answers every quick button from the data', async () => {
    const fetchMock = withModel();
    for (const quick of ['hungry', 'tired', 'nearby', 'plan'] as const) {
      const reply = await routeChat(request({ kind: 'quick', quick }), 'fast');
      expect(reply.blocks.length).toBeGreaterThan(0);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not mistake “an toàn” (safe) for food', async () => {
    vi.stubEnv('AI_MODE', 'off');
    const reply = await routeChat(request({ kind: 'text', text: 'Sài Gòn có an toàn không?' }), 'fast');
    expect(places(reply)).toEqual([]);
  });
  it('says plainly when a district is outside the demo area', async () => {
    const reply = await routeChat(request({ kind: 'text', text: 'Quán ăn ngon ở Quận 7?' }), 'fast');
    expect(reply.reply_text).toContain('Quận 1 và Quận 3');
  });
});

it('leaves a described wish near the traveller to the model', async () => {
  vi.stubEnv('AI_MODE', 'off');
  const reply = await routeChat(request({ kind: 'text', text: 'Is there a quiet place to read a book nearby?' }), 'fast');
  expect(reply.fallback).toBe(true);
  vi.unstubAllEnvs();
});

describe('questions judges asked on 17/11', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  const withModel = () => { vi.stubEnv('AI_MODE', 'on'); vi.stubEnv('LLM_API_KEY', 'test-key'); const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); return fetchMock; };
  const prices = (r: Awaited<ReturnType<typeof routeChat>>) => r.blocks.flatMap(b => b.type === 'price_check' ? [b] : []);

  it('suggests evening spots for “tối nay đi đâu chơi” without the model', async () => {
    const fetchMock = withModel();
    for (const text of ['Tối nay đi đâu chơi?', 'Gợi ý chỗ đi chơi buổi tối ở Quận 1', 'What to do tonight?']) {
      const reply = await routeChat(request({ kind: 'text', text }), 'fast');
      expect(places(reply).length).toBeGreaterThan(0);
      expect(places(reply)[0].category).toBe('diem_dem');
      expect(places(reply).some(p => p.category === 'quan_an')).toBe(false);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('answers a walk between two named places with distance and time, not opening hours', async () => {
    withModel();
    const reply = await routeChat(request({ kind: 'text', text: 'Từ Dinh Độc Lập đi bộ tới Nhà thờ Đức Bà mất bao lâu?' }), 'fast');
    expect(reply.reply_text).toMatch(/^Từ Dinh Độc Lập đến Nhà thờ Đức Bà Sài Gòn khoảng \d+ m: đi bộ chừng \d+ phút/);
    expect(places(reply).map(p => p.name)).toEqual(['Nhà thờ Đức Bà Sài Gòn']);
  });
  it('estimates a taxi fare from the checked per-km price', async () => {
    const fetchMock = withModel();
    const reply = await routeChat(request({ kind: 'text', text: 'Taxi từ chợ Bến Thành tới Dinh Độc Lập bao nhiêu tiền?' }), 'fast');
    expect(reply.reply_text).toMatch(/^Từ Chợ Bến Thành đến Dinh Độc Lập khoảng \d+ m: đi bộ chừng \d+ phút; quãng ngắn nên đi bộ là nhanh nhất, taxi tính 13,5–18,4 nghìn\/km/);
    const far = await routeChat(request({ kind: 'text', text: 'Taxi từ chợ Bến Thành tới Thảo Cầm Viên bao nhiêu tiền?' }), 'fast');
    expect(far.reply_text).toMatch(/^Từ Chợ Bến Thành đến Thảo Cầm Viên Sài Gòn khoảng [\d,]+ km: .*taxi ước \d+–\d+ nghìn đồng/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('leaves a trip with one unknown end to the model', async () => {
    vi.stubEnv('AI_MODE', 'off');
    const reply = await routeChat(request({ kind: 'text', text: 'Từ chợ Bến Thành đi Landmark 81 mất bao lâu?' }), 'fast');
    expect(reply.reply_text).not.toMatch(/^Từ /);
  });
  it('measures from the traveller when only one place is named', async () => {
    withModel();
    const reply = await routeChat(request({ kind: 'text', text: 'Đi bộ tới Dinh Độc Lập mất bao lâu?' }), 'fast');
    expect(reply.reply_text).toMatch(/^Từ Bến Thành đến Dinh Độc Lập/);
  });
  it('still answers how long a visit takes from the place card', async () => {
    withModel();
    const reply = await routeChat(request({ kind: 'text', text: 'Tham quan Dinh Độc Lập mất bao lâu?' }), 'fast');
    expect(reply.reply_text).toMatch(/^Dinh Độc Lập: mở/);
  });
  it('checks prices with “đắt”, “tiếng” and named items without the model', async () => {
    const fetchMock = withModel();
    const cyclo = await routeChat(request({ kind: 'text', text: 'Xích lô 500k một tiếng có đắt không?' }), 'fast');
    expect(prices(cyclo)[0]).toMatchObject({ item: 'xích lô', user_price: 500, reference_max: 100, verdict: 'too_high' });
    expect(cyclo.reply_text).not.toMatch(/Giả sử/);
    const two = await routeChat(request({ kind: 'text', text: 'Đi xích lô 2 tiếng 180 nghìn có hợp lý không?' }), 'fast');
    expect(prices(two)[0]).toMatchObject({ reference_max: 200, verdict: 'fair' });
    const banhmi = await routeChat(request({ kind: 'text', text: 'Bánh mì 60k có đắt không?' }), 'fast');
    expect(prices(banhmi)[0]).toMatchObject({ item: 'bánh mì', verdict: 'too_high' });
    const coconut = await routeChat(request({ kind: 'text', text: 'Nước dừa 30.000đ có bị chặt chém không?' }), 'fast');
    expect(prices(coconut)[0]).toMatchObject({ item: 'dừa tươi', verdict: 'fair' });
    expect(prices(coconut)[0].tip).toMatch(/[ăâđêôơư]/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('finds a price row from a loose tool argument', async () => {
    const { getPriceReference } = await import('../../lib/tools');
    expect(getPriceReference({ item: 'xích lô theo giờ', user_price_vnd: 500000 })).toMatchObject({ item: 'xích lô', verdict: 'too_high' });
    expect(getPriceReference({ item: 'coconut water' })).toMatchObject({ item: 'dừa tươi' });
  });
});

it('runs the reply chips as their fixed action without the model', async () => {
  vi.stubEnv('AI_MODE', 'on'); vi.stubEnv('LLM_API_KEY', 'test-key'); const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  const kinds = async (text: string) => (await routeChat(request({ kind: 'text', text }), 'chip')).blocks.map(b => b.type);
  expect(await kinds('Lên lịch một ngày')).toEqual(['itinerary']);
  expect(await kinds('Trời mưa')).toContain('replan');
  expect(await kinds('Chia sẻ với nhóm')).toContain('group_vote');
  expect(await kinds("I'm hungry")).toEqual(['place_cards']);
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllEnvs(); vi.unstubAllGlobals();
});
