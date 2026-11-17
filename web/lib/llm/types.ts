// Provider-neutral types for the streaming chat path. Only these fields ever reach a provider.
export type ToolCall = { id: string; name: string; arguments: string };

export type ProviderEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_call'; call: ToolCall }
  | { type: 'finish'; reason: string };

export type ProviderConfig = {
  /** Short label recorded in meta and the route log, e.g. opencode-go / mistral. */
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  /** Only sent when set: Mistral rejects unknown fields with 422. */
  reasoningEffort: string | null;
  /** Only OpenCode Go understands x-opencode-session. */
  sessionHeader: boolean;
  /** Reset on every chunk: a quiet model is cut off rather than hanging the turn. */
  idleMs: number;
};

export type ProviderErrorKind = 'timeout' | 'rate_limit' | 'server' | 'auth' | 'config' | 'bad_request' | 'refusal';

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly status: number | null;
  readonly afterOutput: boolean;
  constructor(message: string, kind: ProviderErrorKind, status: number | null = null, afterOutput = false) {
    super(message);
    this.name = 'ProviderError';
    this.kind = kind;
    this.status = status;
    this.afterOutput = afterOutput;
  }
  // Auth/config/bad-request are deterministic; retrying them on another provider cannot help.
  get canFailover(): boolean {
    return !this.afterOutput && (this.kind === 'timeout' || this.kind === 'rate_limit' || this.kind === 'server' || this.kind === 'refusal');
  }
  markAfterOutput(): ProviderError {
    return this.afterOutput ? this : new ProviderError(this.message, this.kind, this.status, true);
  }
}

export function kindForStatus(status: number): ProviderErrorKind {
  if (status === 401 || status === 402 || status === 403) return 'auth';
  if (status === 404) return 'config';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'bad_request';
}
