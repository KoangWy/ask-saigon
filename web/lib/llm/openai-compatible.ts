import { providerChain } from './config';
import { buildBody, flattenContent, parseChunk, parseCompletion, ToolCallAccumulator } from './normalize';
import { readSseData } from './sse';
import { kindForStatus, ProviderError, type ProviderConfig, type ProviderEvent } from './types';

export type Message = { role: 'system' | 'user' | 'assistant' | 'tool'; content: unknown; tool_call_id?: string; tool_calls?: unknown[] };
export interface LlmProvider { runTurn(messages: Message[], tools: unknown[], sessionId: string, signal: AbortSignal, maxTokens?: number): Promise<{ text: string; toolCalls: { id: string; name: string; arguments: string }[]; raw: Message; refusal: boolean }>; }

export class OpenAICompatible implements LlmProvider {
  async runTurn(messages: Message[], tools: unknown[], sessionId: string, signal: AbortSignal, maxTokens = 1200): ReturnType<LlmProvider["runTurn"]> {
    // Tool-call turns need room for JSON arguments; text turns are capped near a short reply so a
    // rambling flash model cannot spend seconds generating prose the user never reads.
    const response = await fetch(`${(process.env.LLM_BASE_URL ?? 'https://opencode.ai/zen/go/v1').replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.LLM_API_KEY ?? ''}`, 'x-opencode-session': sessionId }, body: JSON.stringify({ model: process.env.LLM_MODEL ?? 'deepseek-v4.1-flash', max_tokens: maxTokens, reasoning_effort: 'low', messages, ...(tools.length ? { tools } : {}) }), signal });
    if (!response.ok) throw new Error(`Provider error (${response.status})`);
    const result = await response.json(); const choice = result.choices?.[0]; if (!choice?.message) throw new Error('Invalid provider response'); const msg = choice.message; return { text: typeof msg.content === 'string' ? msg.content : '', toolCalls: (msg.tool_calls ?? []).map((c: { id: string; function: { name: string; arguments: string } }) => ({ id: c.id, name: c.function.name, arguments: c.function.arguments })), raw: { role: 'assistant' as const, content: msg.content ?? null, tool_calls: msg.tool_calls }, refusal: !!msg.refusal || (choice.finish_reason === 'content_filter' || choice.finish_reason === 'refusal') };
  }

  streamTurn(messages: Message[], tools: unknown[], sessionId: string, signal: AbortSignal, maxTokens = 1200, config?: ProviderConfig): AsyncGenerator<ProviderEvent> {
    return streamChat(config ?? providerChain()[0], messages, tools, sessionId, signal, maxTokens);
  }
}

/**
 * Streams one Chat Completions turn. Text deltas are yielded as the model writes them;
 * tool calls are accumulated by index and emitted whole before `finish`. The caller's
 * signal aborts the turn; a separate inactivity timer is reset on every chunk.
 */
export async function* streamChat(config: ProviderConfig, messages: Message[], tools: unknown[], sessionId: string, signal: AbortSignal, maxTokens = 1200): AsyncGenerator<ProviderEvent> {
  const idle = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const touch = () => { clearTimeout(timer); timer = setTimeout(() => idle.abort(new DOMException('Provider idle timeout', 'TimeoutError')), config.idleMs); };
  const close = () => clearTimeout(timer);
  const mapError = (error: unknown): unknown => {
    if (error instanceof ProviderError) return error;
    if (signal.aborted) return new ProviderError(signal.reason?.message ?? 'Aborted', 'timeout');
    if (idle.signal.aborted) return new ProviderError('Provider idle timeout', 'timeout');
    return new ProviderError(error instanceof Error ? error.message : 'Network error', 'server');
  };
  const combined = AbortSignal.any([signal, idle.signal]);
  let response: Response;
  try {
    touch();
    response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'text/event-stream',
        ...(config.sessionHeader ? { 'x-opencode-session': sessionId } : {}),
      },
      body: JSON.stringify(buildBody(config, messages, tools, maxTokens, true)),
      signal: combined,
    });
  } catch (error) {
    close();
    throw mapError(error);
  }
  if (!response.ok) {
    await response.text().catch(() => undefined);
    close();
    throw new ProviderError(`Provider error (${response.status})`, kindForStatus(response.status), response.status);
  }
  if (!response.body) { close(); throw new ProviderError('Empty provider stream', 'server'); }

  // Some endpoints (and mocks) answer stream:true with a single JSON body instead of SSE.
  if (!/text\/event-stream/i.test(response.headers.get('content-type') ?? '')) {
    try {
      const raw = await response.text();
      let completion: ReturnType<typeof parseCompletion> = null;
      try { completion = parseCompletion(JSON.parse(raw)); } catch { /* invalid below */ }
      if (!completion) throw new ProviderError('Invalid provider response', 'server');
      if (completion.refusal) throw new ProviderError('Provider refused', 'refusal');
      if (completion.text) yield { type: 'delta', text: completion.text };
      for (const call of completion.toolCalls) yield { type: 'tool_call', call };
      yield { type: 'finish', reason: completion.toolCalls.length ? 'tool_calls' : 'stop' };
      return;
    } catch (error) {
      throw mapError(error);
    } finally {
      close();
    }
  }

  const calls = new ToolCallAccumulator();
  let reason = 'stop';
  let emitted = false;
  try {
    for await (const payload of readSseData(response.body, touch)) {
      const chunk = parseChunk(payload);
      const choice = (Array.isArray(chunk.choices) ? chunk.choices[0] : null) as Record<string, unknown> | undefined;
      if (!choice) continue;
      const delta = (choice.delta ?? {}) as Record<string, unknown>;
      const text = flattenContent(delta.content);
      if (text) { emitted = true; yield { type: 'delta', text }; }
      calls.add(delta.tool_calls);
      if (choice.finish_reason === 'refusal' || choice.finish_reason === 'content_filter') throw new ProviderError('Provider refused', 'refusal');
      if (choice.finish_reason === 'error') throw new ProviderError('Provider stream error', 'server');
      if (typeof choice.finish_reason === 'string') reason = choice.finish_reason;
    }
    for (const call of calls.drain()) { emitted = true; yield { type: 'tool_call', call }; }
    yield { type: 'finish', reason };
  } catch (error) {
    const mapped = mapError(error);
    throw mapped instanceof ProviderError && emitted ? mapped.markAfterOutput() : mapped;
  } finally {
    close();
  }
}
