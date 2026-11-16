import { describe, expect, it } from 'vitest';
import { searchPlaces, checkPlaceLive, getPriceReference } from '../../lib/tools';
import { routeChat } from '../../lib/router';
import { listRoutes, matchRoutes, rateRoute, routeIntent, routeItinerary, postRoute } from '../../lib/routes';
import { refreshLiveSources, review, submit } from '../../lib/contributions';
import { readStats, recordChat } from '../../lib/stats';
import type { ChatRequest } from '../../lib/schema';

const ctx = { location: { lat: 10.7724, lng: 106.698 }, now: new Date('2026-11-18T10:45:00+07:00'), lang: 'vi' as const };
const request = (input: ChatRequest['input'], extra: Partial<ChatRequest> = {}): ChatRequest => ({ input, history: [], state: { lang: 'vi', location: { ...ctx.location, label: 'Bến Thành', source: 'picked' }, now: ctx.now.toISOString(), offline: true }, ...extra });

describe('dish and late-night search', () => {
  it('answers the late phở question with the 24-hour phở shop', () => {
    expect(searchPlaces({ query: 'Gần đây có quán phở nào mở khuya không?', categories: ['quan_an'] }, ctx).map(p => p.name)).toEqual(['Phở Quỳnh']);
  });
  it('keeps every phở shop for a plain phở question', () => {
    const names = searchPlaces({ query: 'quán phở', categories: ['quan_an'] }, ctx).map(p => p.name);
    expect(names).toContain('Phở Quỳnh');
    expect(names).toContain('Phở Hòa Pasteur');
    expect(names.every(n => n.startsWith('Phở'))).toBe(true);
  });
  it('marks 24-hour places and drops the misleading closing time', () => {
    const place = checkPlaceLive({ name: 'Phở Quỳnh' }, ctx).place!;
    expect(place.open_24h).toBe(true);
    expect(place.closes_at).toBeNull();
  });
  it('answers offline with the same card', async () => {
    const reply = await routeChat(request({ kind: 'text', text: 'Gần đây có quán phở nào mở khuya không?' }), 'test');
    const cards = reply.blocks.find(b => b.type === 'place_cards');
    expect(cards?.type === 'place_cards' && cards.places.map(p => p.name)).toEqual(['Phở Quỳnh']);
  });
});

describe('source labels', () => {
  it('labels every line and puts the official source first', () => {
    const palace = checkPlaceLive({ name: 'Dinh Độc Lập' }, ctx).place!;
    expect(palace.label).toBe('chinh_thuc');
    expect(palace.sources?.length).toBeGreaterThan(1);
    expect(palace.sources?.[0].label).toBe('chinh_thuc');
    expect(palace.sources?.some(s => s.source.includes('visithcmc.vn'))).toBe(true);
  });
  it('shows a business source with its own label', () => {
    const banhmi = checkPlaceLive({ name: 'Bánh mì Huỳnh Hoa' }, ctx).place!;
    expect(banhmi.sources?.map(s => s.label)).toEqual(['chinh_thuc', 'doanh_nghiep']);
  });
  it('keeps both prices when sources disagree, official first', () => {
    const ticket = getPriceReference({ item: 'vé người lớn Bảo tàng Chứng tích Chiến tranh', user_price_vnd: 60000 }, 'vi');
    expect(ticket.found && 'sources' in ticket && ticket.sources.map(s => s.label)).toEqual(['chinh_thuc', 'tham_khao']);
  });
});

describe('creator routes', () => {
  it('recognises route questions but not metro price questions', () => {
    expect(routeIntent('Gợi ý một ngày đi bụi bằng metro')).toBe(true);
    expect(routeIntent('Giá vé metro bao nhiêu?')).toBe(false);
  });
  it('suggests the metro route for a metro backpacking question', async () => {
    const reply = await routeChat(request({ kind: 'text', text: 'Gợi ý một ngày đi bụi bằng metro' }), 'test');
    const block = reply.blocks[0];
    expect(block.type).toBe('route_cards');
    if (block.type === 'route_cards') { expect(block.routes[0].id).toBe('metro-mot-ngay'); expect(block.routes[0].green).toBe(true); }
  });
  it('follows a route in its own order, on foot', async () => {
    const [route] = matchRoutes('metro', await listRoutes('vi'));
    const plan = routeItinerary(route, ctx.now);
    expect(plan.days[0].stops.map(s => s.place_id)).toEqual(route.stops.map(s => s.place_id));
    expect(plan.days[0].legs.every(l => l.mode === 'walking')).toBe(true);
    const reply = await routeChat(request({ kind: 'follow_route', route_id: route.id }), 'test');
    expect(reply.blocks[0].type).toBe('itinerary');
  });
  it('averages one rating per browser', async () => {
    await rateRoute('sai-gon-sau-11-gio', 'browser-a', 5);
    await rateRoute('sai-gon-sau-11-gio', 'browser-a', 3);
    const rating = await rateRoute('sai-gon-sau-11-gio', 'browser-b', 5);
    expect(rating).toEqual({ average: 4, count: 2 });
  });
  it('shows a posted route only to its author until it is approved', async () => {
    const route = await postRoute({ author: 'Test', title: 'Test route', summary: '', modes: ['walk'], stops: [{ place_id: 'q1-001' }, { place_id: 'q1-018' }], owner: 'author-1' });
    expect((await listRoutes('vi', 'author-1')).some(r => r.id === route.id && r.status === 'pending')).toBe(true);
    expect((await listRoutes('vi', 'someone-else')).some(r => r.id === route.id)).toBe(false);
  });
});

describe('contributions and reports', () => {
  it('shows an approved business update with its label, and its hours win over a reference source', async () => {
    const item = await submit({ kind: 'update', role: 'doanh_nghiep', place_id: 'q1-019', field: 'hours', value: 'daily 10:00-22:00', organization: 'Bún chả 145' });
    expect(item?.status).toBe('pending');
    await refreshLiveSources(0);
    expect(checkPlaceLive({ name: 'Bún chả 145' }, ctx).place!.sources?.some(s => s.label === 'doanh_nghiep')).toBe(false);
    await review(item!.id, 'approved');
    await refreshLiveSources(0);
    const place = checkPlaceLive({ name: 'Bún chả 145' }, ctx).place!;
    expect(place.sources?.find(s => s.label === 'doanh_nghiep')?.note).toContain('10:00');
    expect(place.open_now).toBe(true);
  });
  it('rejects hours that do not parse', async () => {
    expect(await submit({ kind: 'update', role: 'doanh_nghiep', place_id: 'q1-019', field: 'hours', value: 'sometimes' })).toBeNull();
  });
});

describe('anonymous demand stats', () => {
  it('counts topic, hour and places per channel without storing text', async () => {
    const req = request({ kind: 'text', text: 'phở' }, { partner: 'tour-cua-ban' });
    const reply = await routeChat(req, 'test');
    await recordChat(req, reply, ctx.now);
    const stats = await readStats('tour-cua-ban', 1, ctx.now);
    expect(stats.total).toBe(1);
    expect(stats.topics.places).toBe(1);
    expect(stats.hours[10]).toBe(1);
    expect(JSON.stringify(stats)).not.toContain('phở');
  });
});
