import { z } from 'zod';
import { submit } from '../../../lib/contributions';
import { body, guard } from '../../../lib/http';
export const runtime = 'nodejs';
// "Suggest adding this": a question the checked data could not answer goes to the review queue.
const Request = z.object({ question: z.string().trim().min(3).max(200), note: z.string().max(500).optional() });
export async function POST(req: Request) {
  const blocked = guard(req, 'request', 10); if (blocked) return blocked;
  const parsed = Request.safeParse(await body(req)); if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const item = await submit({ kind: 'request', role: 'ca_nhan', field: 'other', value: parsed.data.question, note: parsed.data.note });
  return item ? Response.json({ id: item.id, status: item.status }) : Response.json({ error: 'Invalid request' }, { status: 400 });
}
