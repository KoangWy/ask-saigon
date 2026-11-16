// Shared guards for the JSON API routes: same-origin browser calls only, JSON bodies, and a small
// per-IP budget so the public forms cannot be flooded.
const hits = new Map<string, number[]>();
export function guard(req: Request, bucket: string, max = 20, windowMs = 600000): Response | null {
  const origin = req.headers.get('origin');
  if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(req.url).origin)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (req.method === 'POST' && !/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type') ?? '')) return Response.json({ error: 'Unsupported media type' }, { status: 415 });
  if (req.method !== 'POST') return null;
  const key = `${bucket}:${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'}`, now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => t > now - windowMs);
  if (recent.length >= max) return Response.json({ error: 'Too many requests' }, { status: 429 });
  recent.push(now); hits.set(key, recent);
  return null;
}
export async function body(req: Request): Promise<unknown> { try { return await req.json(); } catch { return null; } }

// Public data API (/api/v1): any site or app may call it. It returns checked data only, no model,
// so it costs nothing per call; one IP gets 60 calls a minute.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
export async function publicApi(req: Request, handler: (q: URLSearchParams) => Promise<unknown> | unknown): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { store } = await import('./store');
  try { const [count] = await store.incrMany([{ key: `rl:api:${ip}:${Math.floor(Date.now() / 60000)}`, seconds: 70 }]); if (count > 60) return Response.json({ error: 'Too many requests: 60 per minute' }, { status: 429, headers: CORS }); } catch {}
  try { return Response.json(await handler(new URL(req.url).searchParams), { headers: CORS }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400, headers: CORS }); }
}
