import { z } from 'zod';
import { submit } from '../../../lib/contributions';
import { body, guard } from '../../../lib/http';
export const runtime = 'nodejs';
const Report = z.object({ place_id: z.string().max(20).optional(), price_id: z.string().max(80).optional(), issue: z.enum(['hours', 'price', 'closed', 'other']), note: z.string().max(500).optional() });
export async function POST(req: Request) {
  const blocked = guard(req, 'report', 10); if (blocked) return blocked;
  const parsed = Report.safeParse(await body(req)); if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const { issue, ...rest } = parsed.data;
  const item = await submit({ ...rest, kind: 'report', role: 'ca_nhan', field: issue });
  return item ? Response.json({ id: item.id, status: item.status }) : Response.json({ error: 'Unknown place' }, { status: 404 });
}
