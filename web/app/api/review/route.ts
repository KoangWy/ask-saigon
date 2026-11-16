import { z } from 'zod';
import { listSubmissions, review } from '../../../lib/contributions';
import { body, guard } from '../../../lib/http';
import { store } from '../../../lib/store';
import type { StoredRoute } from '../../../lib/routes';
export const runtime = 'nodejs';
// The review queue for the Ask Saigon team (and, on the city channel, the tourism department).
const allowed = (req: Request) => !!process.env.REVIEW_KEY && req.headers.get('x-review-key') === process.env.REVIEW_KEY;
export async function GET(req: Request) {
  const blocked = guard(req, 'review'); if (blocked) return blocked;
  if (!allowed(req)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json({ submissions: await listSubmissions(), routes: Object.values(await store.hgetall<StoredRoute>('routes')).sort((a, b) => b.created_at.localeCompare(a.created_at)) });
}
const Decision = z.object({ id: z.string().max(40), status: z.enum(['approved', 'rejected']), type: z.enum(['submission', 'route']) });
export async function POST(req: Request) {
  const blocked = guard(req, 'review', 200); if (blocked) return blocked;
  if (!allowed(req)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = Decision.safeParse(await body(req)); if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const { id, status, type } = parsed.data;
  if (type === 'route') {
    const route = await store.hget<StoredRoute>('routes', id); if (!route) return Response.json({ error: 'Not found' }, { status: 404 });
    if (status === 'approved') await store.hset('routes', id, { ...route, status: 'published' }); else await store.hset('routes', id, { ...route, status: 'pending', owner: 'rejected' });
    return Response.json({ ok: true });
  }
  const item = await review(id, status);
  return item ? Response.json({ ok: true }) : Response.json({ error: 'Not found' }, { status: 404 });
}
