// Benchmarks the same prompt + tool schema on both providers. Keys are parsed from .env.local
// but never printed. Usage: pnpm tsx scripts/bench-llm.ts [--runs=5]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_PROMPT } from '../lib/agent/prompt';
import { tools } from '../lib/agent/tools';
import { mistralConfig, opencodeConfig } from '../lib/llm/config';
import { streamChat } from '../lib/llm/openai-compatible';
import type { ProviderConfig } from '../lib/llm/types';

// tsx does not load .env.local (Next.js does), so load it here without echoing any value.
function loadEnv() {
  try {
    for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch { /* no local env file: rely on the process environment */ }
}
loadEnv();

const runs = Number(process.argv.find(a => a.startsWith('--runs='))?.slice(7)) || 5;
const messages = [
  { role: 'system' as const, content: SYSTEM_PROMPT },
  { role: 'user' as const, content: 'Tối nay đi đâu chơi mà không mưa ướt?\nContext: {"lang":"vi","location":{"lat":10.7724,"lng":106.698,"label":"Ben Thanh","source":"picked"},"now":"2026-11-18T14:00:00.000Z","offline":false}' },
];

type Sample = { ms: number; ttft: number; text: string; calls: number; ok: boolean; error?: string };
async function run(config: ProviderConfig): Promise<Sample> {
  const start = Date.now();
  let ttft = -1, text = '', calls = 0, ok = false, error: string | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    for await (const event of streamChat(config, messages, tools, `bench-${crypto.randomUUID()}`, controller.signal, 1200)) {
      if (event.type === 'delta') { if (ttft < 0) ttft = Date.now() - start; text += event.text; }
      else if (event.type === 'tool_call') calls += 1;
      else if (event.type === 'finish') ok = true;
    }
  } catch (e) {
    error = e instanceof Error ? e.name : 'Error';
  } finally {
    clearTimeout(timer);
  }
  return { ms: Date.now() - start, ttft, text, calls, ok, error };
}

const avg = (xs: number[]) => xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : -1;
async function benchmark(label: string, config: ProviderConfig | null) {
  if (!config) { console.log(`${label}: not run (no key configured)`); return; }
  const samples: Sample[] = [];
  for (let i = 0; i < runs; i += 1) samples.push(await run(config));
  const ok = samples.filter(s => s.ok);
  console.log(`${label} ${config.model} (${config.baseUrl})`);
  console.log(`  success=${ok.length}/${runs}  avg TTFT=${avg(ok.map(s => s.ttft))}ms  avg total=${avg(ok.map(s => s.ms))}ms  tool calls=${avg(ok.map(s => s.calls))}`);
  console.log(`  sample answer: ${JSON.stringify((ok[0] ?? samples[0]).text.slice(0, 280))}`);
  const failures = samples.filter(s => !s.ok);
  if (failures.length) console.log(`  failures: ${failures.map(s => s.error ?? 'incomplete').join(', ')}`);
}

async function main() {
  console.log(`Benchmark: ${runs} runs per provider, identical prompt + ${tools.length} tools.\n`);
  await benchmark('mistral  ', mistralConfig());
  console.log('');
  await benchmark('opencode ', opencodeConfig());
}
void main();
