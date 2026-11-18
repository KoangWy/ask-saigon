import { afterEach, describe, expect, it, vi } from 'vitest';
import { FailoverProvider } from '../../lib/llm/failover';
import { mistralConfig, opencodeConfig } from '../../lib/llm/config';
import type { ProviderEvent } from '../../lib/llm/types';

const sse = (frames: string[]) => new Response(frames.map(f => `data: ${f}\n\n`).join(''), { status: 200, headers: { 'content-type': 'text/event-stream' } });
const textFrame = (t: string) => JSON.stringify({ choices: [{ delta: { content: t } }] });
const done = JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] });
const collect = async (gen: AsyncGenerator<ProviderEvent>) => { const out: ProviderEvent[] = []; for await (const e of gen) out.push(e); return out; };
const turn = () => new FailoverProvider(opencodeConfig(), mistralConfig());
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('fallback provider', () => {
  it('is disabled without a fallback key', () => {
    vi.stubEnv('LLM_FALLBACK_API_KEY', '');
    vi.stubEnv('MISTRAL_API_KEY', ''); expect(mistralConfig()).toBeNull();
    expect(turn().label).toBe('opencode-go');
  });

  it('switches to Mistral on a 5xx before any text and sends no OpenCode-only fields', async () => {
    vi.stubEnv('LLM_API_KEY', 'primary-key');
    vi.stubEnv('LLM_FALLBACK_API_KEY', 'fallback-key');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(sse([textFrame('Bonjour'), done]));
    vi.stubGlobal('fetch', fetchMock);
    const p = turn();
    const events = await collect(p.stream([], [], 's', new AbortController().signal, 500));
    expect(events.filter(e => e.type === 'delta').map(e => (e as { text: string }).text).join('')).toBe('Bonjour');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('api.mistral.ai');
    expect(fetchMock.mock.calls[1][1].headers['x-opencode-session']).toBeUndefined();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ model: 'deepseek-v4-1-flash-1017' });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).reasoning_effort).toBeUndefined();
    expect(p.label).toBe('mistral');
  });

  it('never fails over on an auth error', async () => {
    vi.stubEnv('LLM_API_KEY', 'primary-key');
    vi.stubEnv('LLM_FALLBACK_API_KEY', 'fallback-key');
    const fetchMock = vi.fn().mockResolvedValue(new Response('no', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(collect(turn().stream([], [], 's', new AbortController().signal, 500))).rejects.toMatchObject({ kind: 'auth', canFailover: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never switches after text was streamed, even in a later round', async () => {
    vi.stubEnv('LLM_API_KEY', 'primary-key');
    vi.stubEnv('LLM_FALLBACK_API_KEY', 'fallback-key');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(sse([textFrame('Already writing '), done]))
      .mockResolvedValueOnce(new Response('boom', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    const p = turn();
    await collect(p.stream([], [], 's', new AbortController().signal, 500));
    await expect(collect(p.stream([], [], 's', new AbortController().signal, 500))).rejects.toMatchObject({ afterOutput: true, kind: 'server' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).not.toContain('api.mistral.ai');
  });

  it('uses the fallback for all remaining rounds once switched', async () => {
    vi.stubEnv('LLM_API_KEY', 'primary-key');
    vi.stubEnv('LLM_FALLBACK_API_KEY', 'fallback-key');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('boom', { status: 429 }))
      .mockResolvedValueOnce(sse([JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'a', function: { name: 'get_weather', arguments: '{}' } }] } }] }), done]))
      .mockResolvedValueOnce(sse([textFrame('Fallback answer'), done]));
    vi.stubGlobal('fetch', fetchMock);
    const p = turn();
    expect((await collect(p.stream([], [], 's', new AbortController().signal, 500))).some(e => e.type === 'tool_call')).toBe(true);
    expect((await collect(p.stream([], [], 's', new AbortController().signal, 500))).some(e => e.type === 'delta')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.slice(1).every(c => String(c[0]).includes('api.mistral.ai'))).toBe(true);
  });

  it('does not retry a caller abort', async () => {
    vi.stubEnv('LLM_API_KEY', 'primary-key');
    vi.stubEnv('LLM_FALLBACK_API_KEY', 'fallback-key');
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(collect(turn().stream([], [], 's', controller.signal, 500))).rejects.toMatchObject({ kind: 'timeout' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('provider order', () => {
  it('tries Mistral first with OpenCode Go as the fallback, and honours LLM_PRIMARY=opencode', async () => {
    const { providerChain } = await import('../../lib/llm/config');
    vi.stubEnv('LLM_API_KEY', 'oc'); vi.stubEnv('MISTRAL_API_KEY', 'mi');
    expect(providerChain().map(c => c?.label)).toEqual(['mistral', 'opencode-go']);
    vi.stubEnv('LLM_PRIMARY', 'opencode');
    expect(providerChain().map(c => c?.label)).toEqual(['opencode-go', 'mistral']);
    vi.stubEnv('LLM_PRIMARY', ''); vi.stubEnv('LLM_API_KEY', '');
    expect(providerChain().map(c => c?.label)).toEqual(['mistral', undefined]);
    vi.stubEnv('MISTRAL_API_KEY', ''); vi.stubEnv('LLM_FALLBACK_API_KEY', 'old-name');
    expect(providerChain()[0].label).toBe('mistral');
  });
});
