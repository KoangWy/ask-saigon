import type { ProviderConfig } from './types';

const idleMs = () => Number(process.env.LLM_STREAM_IDLE_MS) || 15000;

export function primaryConfig(): ProviderConfig {
  return {
    label: 'opencode-go',
    baseUrl: (process.env.LLM_BASE_URL ?? 'https://opencode.ai/zen/go/v1').replace(/\/$/, ''),
    model: process.env.LLM_MODEL ?? 'deepseek-v4.1-flash',
    apiKey: process.env.LLM_API_KEY ?? '',
    reasoningEffort: 'low',
    sessionHeader: true,
    idleMs: idleMs(),
  };
}
