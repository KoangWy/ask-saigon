import { ProviderError } from './types';

const record = (v: unknown): Record<string, unknown> | null => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;

/**
 * Text of a Chat Completions `content` value. Mistral reasoning models send arrays of
 * chunks (`thinking` plus `text`) in both full and streamed responses: only `text` is kept,
 * so reasoning never reaches the answer, a tool argument, or a log.
 */
export function flattenContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  let text = '';
  for (const chunk of content) {
    const c = record(chunk);
    if (c?.type === 'text' && typeof c.text === 'string') text += c.text;
  }
  return text;
}

// Collects streamed tool-call fragments by index until the stream finishes.
export class ToolCallAccumulator {
  private readonly calls = new Map<number, { id: string; name: string; arguments: string }>();
  add(deltaToolCalls: unknown): void {
    if (!Array.isArray(deltaToolCalls)) return;
    deltaToolCalls.forEach((entry, position) => {
      const f = record(entry);
      if (!f) return;
      const index = typeof f.index === 'number' ? f.index : position;
      const pending = this.calls.get(index) ?? { id: '', name: '', arguments: '' };
      const fn = record(f.function);
      if (typeof f.id === 'string' && f.id) pending.id = f.id;
      if (typeof fn?.name === 'string') pending.name += fn.name;
      if (typeof fn?.arguments === 'string') pending.arguments += fn.arguments;
      else if (fn?.arguments && typeof fn.arguments === 'object') pending.arguments += JSON.stringify(fn.arguments);
      this.calls.set(index, pending);
    });
  }
  drain(): { id: string; name: string; arguments: string }[] {
    const calls = [...this.calls.entries()].sort(([a], [b]) => a - b).map(([, c]) => c).filter(c => c.id && c.name);
    this.calls.clear();
    return calls;
  }
}

// A provider that answers stream:true with a plain JSON body (and the test/mock path) is
// normalized as one complete response so callers see the same events either way.
export function parseCompletion(body: unknown): { text: string; toolCalls: { id: string; name: string; arguments: string }[]; refusal: boolean } | null {
  const root = record(body);
  const choices = root?.choices;
  const choice = Array.isArray(choices) ? record(choices[0]) : null;
  const message = choice ? record(choice.message) : null;
  if (!root || !choice || !message) return null;
  const toolCalls = (Array.isArray(message.tool_calls) ? message.tool_calls : []).flatMap(entry => {
    const c = record(entry), fn = c ? record(c.function) : null;
    if (!c || !fn || typeof c.id !== 'string' || typeof fn.name !== 'string') return [];
    return [{ id: c.id, name: fn.name, arguments: typeof fn.arguments === 'string' ? fn.arguments : JSON.stringify(fn.arguments ?? {}) }];
  });
  return { text: flattenContent(message.content), toolCalls, refusal: !!message.refusal || choice.finish_reason === 'refusal' || choice.finish_reason === 'content_filter' };
}

export function parseChunk(payload: string): Record<string, unknown> {
  let chunk: Record<string, unknown> | null = null;
  try { chunk = record(JSON.parse(payload)); } catch { /* malformed below */ }
  if (!chunk) throw new ProviderError('Malformed stream event', 'server');
  if (chunk.error !== undefined || chunk.object === 'error') throw new ProviderError('Provider stream error', 'server');
  return chunk;
}

/** Only standard fields: reasoning_effort/x-opencode-session are opt-in per provider. */
export function buildBody(config: { model: string; reasoningEffort: string | null }, messages: unknown[], tools: unknown[], maxTokens: number, stream: boolean): Record<string, unknown> {
  return {
    model: config.model,
    max_tokens: maxTokens,
    stream,
    messages,
    ...(tools.length ? { tools } : {}),
    ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
  };
}
