import { describe, expect, it } from 'vitest';
import { itinerary, places, prices, routes } from '../../lib/publicapi';
import { publicApi } from '../../lib/http';

const q = (s: string) => new URLSearchParams(s);
describe('public data API', () => {
  it('finds places by name or by question, with labelled sources', async () => {
    expect((await places(q('q=Dinh Độc Lập'))).places[0].id).toBe('q1-004');
    const late = await places(q('q=phở mở khuya'));
    expect(late.places.map(p => p.name)).toContain('Phở Quỳnh');
    expect(late.places.every(p => p.sources?.length)).toBe(true);
  });
  it('checks an offered price against the reference', async () => {
    const r = await prices(q('item=cyclo&price_vnd=300000'));
    expect(r.price && 'verdict' in r.price && r.price.verdict).toBe('too_high');
  });
  it('lists routes and turns one into an itinerary', async () => {
    expect((await routes(q('lang=en'))).routes.length).toBeGreaterThanOrEqual(3);
    expect((await itinerary(q('route=metro-mot-ngay'))).itinerary.days[0].stops[0].place_id).toBe('q1-025');
  });
  it('answers cross-origin with CORS and rejects bad input', async () => {
    const ok = await publicApi(new Request('https://x/api/v1/places?q=pho', { headers: { origin: 'https://partner.example' } }), places);
    expect(ok.headers.get('access-control-allow-origin')).toBe('*');
    const bad = await publicApi(new Request('https://x/api/v1/places?category=nope'), places);
    expect(bad.status).toBe(400);
  });
});
