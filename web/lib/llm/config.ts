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

// Mistral rejects unknown fields (422 extra_forbidden), so no reasoning_effort and no
// x-opencode-session here. Fallback is opt-in: without a key it is never attempted.
export function fallbackConfig(): ProviderConfig | null {
  const apiKey = process.env.LLM_FALLBACK_API_KEY;
  if (!apiKey) return null;
  return {
    label: 'mistral',
    baseUrl: (process.env.LLM_FALLBACK_BASE_URL ?? 'https://api.mistral.ai/v1').replace(/\/$/, ''),
    model: process.env.LLM_FALLBACK_MODEL ?? 'deepseek-v4-1-flash-1017',
    apiKey,
    reasoningEffort: null,
    sessionHeader: false,
    idleMs: idleMs(),
  };
}

// Which provider a chat turn tries first. Default: OpenCode Go, then Mistral if its key is set.
// LLM_PRIMARY=mistral swaps them (Mistral first, OpenCode Go as the fallback).
export function providerChain(): [ProviderConfig, ProviderConfig | null] {
  const opencode = primaryConfig(), mistral = fallbackConfig();
  return process.env.LLM_PRIMARY === 'mistral' && mistral ? [mistral, opencode.apiKey ? opencode : null] : [opencode, mistral];
}
