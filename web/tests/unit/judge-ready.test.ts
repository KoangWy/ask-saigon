import { afterEach, describe, expect, it, vi } from 'vitest';
import { routeIntent } from '../../lib/routes';
import { sanitizeReplyText, saysNotInData } from '../../lib/agent/format';
import { fastAnswer } from '../../lib/fastpath';
import type { ChatRequest, Reply } from '../../lib/schema';
import { POST } from '../../app/api/requests/route';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const state = { lang: 'en' as const, location: { lat: 10.7725, lng: 106.698, label: 'Ben Thanh', source: 'picked' as const }, now: '2026-11-18T03:00:00Z', offline: false };
const base = (text: string): Reply => ({ reply_text: text, blocks: [], quick_replies: [], simulated: false, fallback: false, source: 'rules' });

describe('judge-eval regressions', () => {
  it('sends metro hours and ticket questions to the agent, not to community routes', () => {
    expect(routeIntent('Metro chạy đến mấy giờ?')).toBe(false);
    expect(routeIntent('How do I buy a metro ticket?')).toBe(false);
    expect(routeIntent('Gợi ý lộ trình đi metro một ngày')).toBe(true);
  });

  it('lets the model answer "Is there a pharmacy nearby?" instead of listing unrelated places', () => {
    const ctx = { location: state.location, now: new Date(state.now), lang: 'en' as const };
    expect(fastAnswer({ input: { kind: 'text', text: 'Is there a pharmacy nearby?' }, history: [], state } as ChatRequest, ctx, base)).toBeNull();
    expect(fastAnswer({ input: { kind: 'text', text: 'What is nearby?' }, history: [], state } as ChatRequest, ctx, base)).not.toBeNull();
  });

  it('keeps the model sentences when card-detail filtering would leave only a question', () => {
    const place = { id: 'q1-001', name: 'Ben Thanh Market', category: 'di_tich', district: 'Q1', address: 'Le Loi', lat: 10.77, lng: 106.69, photo_url: null, open_now: true, closes_at: '22:00', opens_at: null, hours_checked: true, distance_m: 50, price_range: null, source: 's', checked_at: '2026-10-30', maps_url: 'm' };
    const out = sanitizeReplyText('Ben Thanh Market is open now for souvenirs. Saigon Square is open now too. Want details on either?', [{ type: 'place_cards', places: [place as never] }]);
    expect(out).toContain('souvenirs');
  });

  it('recognises the agent saying the checked data has no answer', () => {
    expect(saysNotInData("I don't have a verified craft-beer taproom in my checked list yet")).toBe(true);
    expect(saysNotInData('Mình chưa có quán bún bò Huế nào trong dữ liệu đã kiểm ở quận 1')).toBe(true);
    expect(saysNotInData('Bun Rieu Ganh is open now and two minutes away.')).toBe(false);
  });

  it('queues a data request from the "Suggest adding" button', async () => {
    const res = await POST(new Request('http://localhost/api/requests', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify({ question: 'craft beer in District 1' }) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'pending' });
  });
});
