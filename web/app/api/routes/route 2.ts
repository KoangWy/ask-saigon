import { z } from 'zod';
import { body, guard } from '../../../lib/http';
import { listRoutes, postRoute } from '../../../lib/routes';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const blocked = guard(req, 'routes'); if (blocked) return blocked;
  const q = new URL(req.url).searchParams;
  return Response.json({ routes: await listRoutes(q.get('lang') === 'vi' ? 'vi' : 'en', q.get('client') ?? undefined) });
}
const Draft = z.object({ author: z.string().trim().min(2).max(40), title: z.string().trim().min(4).max(90), summary: z.string().trim().max(300), modes: z.array(z.enum(['metro', 'bus', 'walk', 'bike', 'motorbike', 'car'])).min(1).max(4), stops: z.array(z.object({ place_id: z.string().max(20), note: z.string().max(80).optional() })).min(2).max(10), client_id: z.string().max(64) });
export async function POST(req: Request) {
  const blocked = guard(req, 'post-route', 5); if (blocked) return blocked;
  const parsed = Draft.safeParse(await body(req)); if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const { client_id, ...draft } = parsed.data;
  const route = await postRoute({ ...draft, owner: client_id });
  return route.stops.length >= 2 ? Response.json({ id: route.id, status: route.status }) : Response.json({ error: 'Unknown places' }, { status: 400 });
}
