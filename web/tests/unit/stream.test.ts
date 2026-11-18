import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChat, OpenAICompatible } from '../../lib/llm/openai-compatible';
import { opencodeConfig } from '../../lib/llm/config';
const primaryConfig = opencodeConfig;
import { flattenContent, ToolCallAccumulator } from '../../lib/llm/normalize';
import type { ProviderEvent } from '../../lib/llm/types';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const sse = (frames: string[]) => new Response(frames.map(f => `data: ${f}\n\n`).join(''), { status: 200, headers: { 'content-type': 'text/event-stream' } });
const collect = async (events: AsyncGenerator<ProviderEvent>) => { const out: ProviderEvent[] = []; for await (const e of events) out.push(e); return out; };

describe('streaming provider', () => {
  it('yields text deltas, accumulates split tool-call arguments by index, then finishes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sse([
      '{"choices":[{"index":0,"delta":{"content":"Xin "}}]}',
      '{"choices":[{"index":0,"delta":{"content":"chào"}}]}',
      '{"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"search_places","arguments":"{\\"query\\":"}}]}}]}',
      '{"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"pho\\"}"}},{"index":1,"id":"call_2","function":{"name":"get_weather","arguments":"{}"}}]}}]}',
      '{"choices":[{"delta":{},"finish_reason":"tool_calls"}]}',
      '[DONE]',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    const events = await collect(streamChat(primaryConfig(), [], [], 'session', new AbortController().signal));
    expect(events.filter(e => e.type === 'delta').map(e => (e as { text: string }).text).join('')).toBe('Xin chào');
    const calls = events.filter(e => e.type === 'tool_call').map(e => (e as { call: { name: string; arguments: string } }).call);
    expect(calls).toEqual([{ id: 'call_1', name: 'search_places', arguments: '{"query":"pho"}' }, { id: 'call_2', name: 'get_weather', arguments: '{}' }]);
    expect(events.at(-1)).toMatchObject({ type: 'finish', reason: 'tool_calls' });
    expect(fetchMock.mock.calls[0][1].headers['x-opencode-session']).toBe('session');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ stream: true, reasoning_effort: 'low' });
  });

  it('drops reasoning chunks and keeps only text chunks in array content', () => {
    expect(flattenContent([{ type: 'thinking', thinking: 'secret' }, { type: 'text', text: 'hello ' }, { type: 'text', text: 'world' }])).toBe('hello world');
    expect(flattenContent('plain')).toBe('plain');
  });

  it('emits a stream error event as a provider error marked after output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sse(['{"choices":[{"delta":{"content":"partial"}}]}', '{"error":{"message":"boom"}}']));
    vi.stubGlobal('fetch', fetchMock);
    await expect(collect(streamChat(primaryConfig(), [], [], 's', new AbortController().signal))).rejects.toMatchObject({ afterOutput: true, kind: 'server' });
  });

  it('normalizes a plain JSON body as one response (non-SSE providers and mocks)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Hello', tool_calls: [{ id: 'a', function: { name: 'get_weather', arguments: '{}' } }] } }] }), { status: 200 })));
    const events = await collect(new OpenAICompatible().streamTurn([], [], 's', new AbortController().signal));
    expect(events.map(e => e.type)).toEqual(['delta', 'tool_call', 'finish']);
  });

  it('does not send the OpenCode session header on a config that disables it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sse(['{"choices":[{"delta":{},"finish_reason":"stop"}]}']));
    vi.stubGlobal('fetch', fetchMock);
    await collect(streamChat({ ...primaryConfig(), label: 'other', sessionHeader: false, reasoningEffort: null }, [], [], 's', new AbortController().signal));
    expect(fetchMock.mock.calls[0][1].headers['x-opencode-session']).toBeUndefined();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).reasoning_effort).toBeUndefined();
  });
});

describe('tool call accumulator', () => {
  it('ignores fragments without an id or name and keeps index order', () => {
    const acc = new ToolCallAccumulator();
    acc.add([{ index: 1, id: 'b', function: { name: 'get_weather', arguments: '{}' } }, { index: 0, function: { arguments: 'x' } }]);
    acc.add([{ index: 0, id: 'a', function: { name: 'search', arguments: 'y' } }]);
    expect(acc.drain()).toEqual([{ id: 'a', name: 'search', arguments: 'xy' }, { id: 'b', name: 'get_weather', arguments: '{}' }]);
  });
});
