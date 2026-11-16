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
