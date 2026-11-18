import type { ProviderConfig } from './types';

const idleMs = () => Number(process.env.LLM_STREAM_IDLE_MS) || 15000;

// Two providers serve the same DeepSeek flash model. Mistral answers each turn 3-5x faster
// (measured 18/11/2026), so it goes first when its key is set; OpenCode Go is the fallback.

// Always built, even without a key: with no provider configured the turn fails at the gateway and
// the router falls back to its rule answers, as before Mistral was added.
export function opencodeConfig(): ProviderConfig {
  const apiKey = process.env.LLM_API_KEY ?? '';
  return {
    label: 'opencode-go',
    baseUrl: (process.env.LLM_BASE_URL ?? 'https://opencode.ai/zen/go/v1').replace(/\/$/, ''),
    model: process.env.LLM_MODEL ?? 'deepseek-v4.1-flash',
    apiKey,
    reasoningEffort: 'low',
    sessionHeader: true,
    idleMs: idleMs(),
  };
}

// Mistral rejects unknown fields (422 extra_forbidden), so no reasoning_effort and no
// x-opencode-session here. LLM_FALLBACK_* are the names used before Mistral went first.
export function mistralConfig(): ProviderConfig | null {
  const env = (name: string) => process.env[`MISTRAL_${name}`] || process.env[`LLM_FALLBACK_${name}`];
  const apiKey = env('API_KEY');
  if (!apiKey) return null;
  return {
    label: 'mistral',
    baseUrl: (env('BASE_URL') ?? 'https://api.mistral.ai/v1').replace(/\/$/, ''),
    model: env('MODEL') ?? 'deepseek-v4-1-flash-1017',
    apiKey,
    reasoningEffort: null,
    sessionHeader: false,
    idleMs: idleMs(),
  };
}

// The provider a chat turn tries first, then its fallback. LLM_PRIMARY=opencode puts OpenCode Go first.
export function providerChain(): [ProviderConfig, ProviderConfig | null] {
  const opencode = opencodeConfig(), mistral = mistralConfig();
  if (!mistral) return [opencode, null];
  if (!opencode.apiKey) return [mistral, null];
  return process.env.LLM_PRIMARY === 'opencode' ? [opencode, mistral] : [mistral, opencode];
}

export const hasLlmKey = () => !!process.env.LLM_API_KEY || mistralConfig() !== null;
