import { streamChat, type Message } from './openai-compatible';
import { ProviderError, type ProviderConfig, type ProviderEvent } from './types';

/**
 * One provider per chat turn. The primary is used until it fails with a transient error
 * BEFORE any text was streamed in this turn; then every remaining round uses the fallback.
 * Auth/config/bad-request errors and caller aborts are never retried. Once text was emitted,
 * a later failure is marked afterOutput and ends the answer instead of joining two providers.
 */
export class FailoverProvider {
  private active: ProviderConfig;
  private switched = false;
  private textEmitted = false;
  constructor(private readonly primary: ProviderConfig, private readonly fallback: ProviderConfig | null) { this.active = primary; }

  get config(): ProviderConfig { return this.active; }
  get label(): string { return this.active.label; }
  get model(): string { return this.active.model; }

  stream(messages: Message[], tools: unknown[], sessionId: string, signal: AbortSignal, maxTokens: number): AsyncGenerator<ProviderEvent> {
    return this.run(messages, tools, sessionId, signal, maxTokens);
  }

  private async *run(messages: Message[], tools: unknown[], sessionId: string, signal: AbortSignal, maxTokens: number): AsyncGenerator<ProviderEvent> {
    // At most two attempts: the active provider, then the fallback once.
    for (;;) {
      const config = this.active;
      let emitted = false;
      try {
        for await (const event of streamChat(config, messages, tools, sessionId, signal, maxTokens)) {
          if (event.type === 'delta') { emitted = true; this.textEmitted = true; }
          if (event.type === 'tool_call') emitted = true;
          yield event;
        }
        return;
      } catch (error) {
        if ((emitted || this.textEmitted) && error instanceof ProviderError) throw error.markAfterOutput();
        if (!this.canFailover(config, error, signal)) throw error;
        this.active = this.fallback!;
        this.switched = true;
      }
    }
  }

  private canFailover(config: ProviderConfig, error: unknown, signal: AbortSignal): boolean {
    return this.fallback !== null && config === this.primary && !this.switched && !this.textEmitted && !signal.aborted && error instanceof ProviderError && error.canFailover;
  }
}
