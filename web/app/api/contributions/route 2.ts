import { SubmissionInput, submit } from '../../../lib/contributions';
import { body, guard } from '../../../lib/http';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const blocked = guard(req, 'contribute', 10); if (blocked) return blocked;
  const parsed = SubmissionInput.safeParse({ ...(await body(req) as object), kind: 'update' }); if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const item = await submit(parsed.data);
  return item ? Response.json({ id: item.id, status: item.status }) : Response.json({ error: 'Unknown place or invalid hours' }, { status: 400 });
}
