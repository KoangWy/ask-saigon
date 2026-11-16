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
