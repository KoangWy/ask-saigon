import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamAgent } from '../../lib/agent';
import { POST } from '../../app/api/chat/route';
import type { ChatRequest } from '../../lib/schema';
import type { AgentEvent } from '../../lib/agent';

const base: ChatRequest = {
  input: { kind: 'text', text: 'Find places' }, history: [],
  state: { lang: 'en', location: { lat: 10.7724, lng: 106.698, label: 'Ben Thanh', source: 'picked' }, now: '2026-11-18T14:00:00Z', offline: false },
};
const sse = (frames: string[]) => new Response(frames.map(f => `data: ${f}\n\n`).join(''), { status: 200, headers: { 'content-type': 'text/event-stream' } });
const call = (id: string, name: string, args: Record<string, unknown>) => JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id, function: { name, arguments: JSON.stringify(args) } }] } }] });
const text = (t: string) => JSON.stringify({ choices: [{ delta: { content: t } }] });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('streaming agent', () => {
  it('emits text deltas then a single authoritative final Reply with deduped cards', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(sse([call('a', 'search_places', { query: 'Ben Thanh' }), JSON.stringify({ choices: [{ delta: {}, finish_reason: 'tool_calls' }] })]))
      .mockResolvedValueOnce(sse([text('Here are '), text('places.'), JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })]));
    vi.stubGlobal('fetch', fetchMock);
    const events: AgentEvent[] = [];
    for await (const e of streamAgent(base)) events.push(e);
    expect(events.filter(e => e.type === 'delta').map(e => (e as { text: string }).text).join('')).toBe('Here are places.');
    const finals = events.filter(e => e.type === 'final');
    expect(finals).toHaveLength(1);
    const reply = (finals[0] as { reply: { reply_text: string; blocks: { type: string }[]; meta?: { provider: string; model: string } } }).reply;
    expect(reply.reply_text).toBe('Here are places.');
    expect(reply.blocks.some(b => b.type === 'place_cards')).toBe(true);
    expect(reply.meta).toMatchObject({ provider: 'opencode-go', model: 'deepseek-v4.1-flash' });
  });
});

describe('chat route SSE', () => {
  const request = (accept?: string) => new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost', ...(accept ? { accept } : {}) },
    body: JSON.stringify({ input: { kind: 'text', text: 'coffee near me' }, history: [], state: base.state, session_id: 's' }),
  });

  it('streams fast/rules answers as one final SSE event when Accept asks for it', async () => {
    const res = await POST(request('text/event-stream'));
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const frames = (await res.text()).split('\n\n').filter(Boolean).map(f => JSON.parse(f.slice(5)));
    expect(frames.map((f: { type: string }) => f.type)).toEqual(['final']);
    expect(frames[0]).toMatchObject({ type: 'final', reply: { source: 'rules' } });
  });

  it('keeps returning plain JSON without the SSE Accept header', async () => {
    const res = await POST(request());
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toMatchObject({ source: 'rules' });
  });
});
