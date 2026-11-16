import { z } from 'zod';
import { body, guard } from '../../../../../lib/http';
import { findRoute, rateRoute } from '../../../../../lib/routes';
export const runtime = 'nodejs';
const Rating = z.object({ stars: z.number().int().min(1).max(5), client_id: z.string().min(8).max(64) });
export async function POST(req: Request, ctx: RouteContext<'/api/routes/[id]/rate'>) {
  const blocked = guard(req, 'rate', 30); if (blocked) return blocked;
  const { id } = await ctx.params;
  const parsed = Rating.safeParse(await body(req)); if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  if (!(await findRoute(id, 'en', parsed.data.client_id))) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ rating: await rateRoute(id, parsed.data.client_id, parsed.data.stars) });
}
