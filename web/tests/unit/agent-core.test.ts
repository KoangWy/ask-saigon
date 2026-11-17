import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAgent } from '../../lib/agent';
import { defs, tools } from '../../lib/agent/tools';
import { TIKTOK_FOUND_SAMPLE_CAPTION } from '../../lib/tiktok-samples';
import type { ChatRequest } from '../../lib/schema';

const base: ChatRequest = {
  input: { kind: 'text', text: 'Find places' }, history: [],
  state: { lang: 'en', location: { lat: 10.7724, lng: 106.698, label: 'Ben Thanh', source: 'picked' }, now: '2026-11-18T14:00:00Z', offline: false },
};
const response = (message: unknown) => new Response(JSON.stringify({ choices: [{ message }] }), { status: 200 });
const toolCalls = (calls: { id: string; function: { name: string; arguments: string } }[]) => ({ content: null, tool_calls: calls });
const call = (id: string, name: string, args: Record<string, unknown>) => ({ id, function: { name, arguments: JSON.stringify(args) } });
const bodyOf = (mock: ReturnType<typeof vi.fn>, index: number) => JSON.parse(mock.mock.calls[index][1].body);
const toolMessages = (mock: ReturnType<typeof vi.fn>, index: number): { role: string; content: string }[] => (bodyOf(mock, index).messages as { role: string; content: string }[]).filter(m => m.role === 'tool');
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('agent tool loop', () => {
  it('chains search_places -> get_story and uses the model text as the reply', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(toolCalls([call('a', 'search_places', { query: 'Ben Thanh', categories: ['di_tich'] })])))
      .mockResolvedValueOnce(response(toolCalls([call('b', 'get_story', { place_id: 'q1-001' })])))
      .mockResolvedValueOnce(response({ content: 'Ben Thanh has a long market history.' }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent(base);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(reply.blocks.map(b => b.type)).toEqual(expect.arrayContaining(['place_cards', 'story']));
    expect(reply.reply_text).toBe('Ben Thanh has a long market history.');
    // The second turn really saw the first tool's result.
    expect(JSON.stringify(bodyOf(fetchMock, 1).messages)).toContain('"role":"tool"');
  });

  it('does not overwrite model search arguments with code-side intent guesses', async () => {
    const text = 'Cà phê view đẹp ở quận 3';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(toolCalls([call('a', 'search_places', { query: text, categories: ['ca_phe'], radius_m: 3000, limit: 3 })])))
      .mockResolvedValueOnce(response({ content: 'Here are cafés with a view.' }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent({ ...base, input: { kind: 'text', text } });
    const places = reply.blocks.find(b => b.type === 'place_cards');
    expect(places?.type === 'place_cards' && places.places.length).toBeGreaterThan(0);
    expect(places?.type === 'place_cards' && places.places.every(p => p.category === 'ca_phe')).toBe(true);
    expect(toolMessages(fetchMock, 1)[0].content).toContain('ca_phe');
  });

  it('answers a follow-up by resolving an id from history with get_place_details', async () => {
    const history = [{ role: 'assistant' as const, text: 'Đây là các địa điểm: [showed places: q1-004, q1-018, q1-005]' }];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(toolCalls([call('a', 'get_place_details', { place_id: 'q1-018' })])))
      .mockResolvedValueOnce(response({ content: 'Quán đó mở đến 22h theo giờ đã kiểm. Đi trước 19h sẽ đỡ đông.' }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent({ ...base, input: { kind: 'text', text: 'Quán thứ hai mở tới mấy giờ?' }, history, state: { ...base.state, lang: 'vi' } });
    expect(reply.blocks).toContainEqual(expect.objectContaining({ type: 'place_cards', places: expect.arrayContaining([expect.objectContaining({ id: 'q1-018' })]) }));
    expect(reply.reply_text).toContain('22h');
    expect(toolMessages(fetchMock, 1)[0].content).toContain('summary');
  });

  it('refuses an out-of-area question without calling the model', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent({ ...base, input: { kind: 'text', text: 'What should I eat in Hà Nội?' } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(reply.source).toBe('rules');
    expect(reply.blocks).toEqual([]);
  });

  it('answers honestly when the model search is empty', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(toolCalls([call('a', 'search_places', { query: 'nonexistent landmark xyz' })])))
      .mockResolvedValueOnce(response({ content: '' }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent(base);
    expect(reply.blocks.some(b => b.type === 'place_cards')).toBe(false);
    expect(reply.reply_text).toMatch(/couldn.t find a matching place/i);
  });

  it('keeps the verified TikTok-found lead sentence', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: TIKTOK_FOUND_SAMPLE_CAPTION, author_name: 'Bánh mì Huynh Hoa', thumbnail_url: '' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent({ ...base, input: { kind: 'sample', sample_id: 'tiktok-found' } });
    expect(reply.blocks).toContainEqual(expect.objectContaining({ type: 'tiktok_result', status: 'found', place: expect.objectContaining({ id: 'q1-018' }) }));
    expect(reply.reply_text).toMatch(/^That video is Huynh Hoa Banh Mi at .*open now until 22:00\./);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('runs the new tools in parallel and pushes their blocks', async () => {
    // The weather fetch shares the mocked fetch: route chat calls to chat responses and the
    // Open-Meteo call to an empty forecast.
    const fetchMock = vi.fn();
    let turn = 0;
    fetchMock.mockImplementation((input: string | URL) => {
      if (String(input).includes('/chat/completions')) return Promise.resolve(response(turn++ === 0 ? toolCalls([call('a', 'get_weather', {}), call('b', 'find_routes', { query: 'metro' }), call('c', 'travel_estimate', { from: 'q1-004', to: 'q1-003' })]) : { content: 'Here is what the checked data says.' }));
      return Promise.resolve(new Response(JSON.stringify({ hourly: { time: [], precipitation_probability: [], precipitation: [] } }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const reply = await runAgent(base);
    expect(reply.blocks.map(b => b.type)).toEqual(expect.arrayContaining(['place_cards', 'route_cards']));
    expect(toolMessages(fetchMock, 2).map(m => m.content)).toEqual(expect.arrayContaining([expect.stringContaining('summary')]));
    expect(reply.reply_text).toBe('Here is what the checked data says.');
  });
});

describe('tool definitions', () => {
  it('documents every tool and parameter, with dataset enums', () => {
    expect(tools.map(t => t.function.name)).toEqual(expect.arrayContaining(['get_place_details', 'get_weather', 'find_routes', 'travel_estimate']));
    for (const tool of tools) {
      expect(tool.function.description.length).toBeGreaterThan(20);
      const params = tool.function.parameters as { properties?: Record<string, { description?: string; enum?: string[] }> };
      for (const value of Object.values(params.properties ?? {})) expect(value.description).toBeTruthy();
    }
    expect(defs.search_places.parse({ categories: ['quan_an'], tags: ['chay'] })).toMatchObject({ categories: ['quan_an'], tags: ['chay'] });
    expect(() => defs.search_places.parse({ categories: ['nonexistent'] })).toThrow();
    expect(() => defs.plan_itinerary.parse({ pace: 'racing' })).toThrow();
  });
});
