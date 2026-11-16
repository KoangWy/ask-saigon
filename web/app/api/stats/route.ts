import { guard } from '../../../lib/http';
import { readStats } from '../../../lib/stats';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const blocked = guard(req, 'stats'); if (blocked) return blocked;
  const q = new URL(req.url).searchParams;
  return Response.json(await readStats(q.get('partner') ?? undefined, Math.min(30, Math.max(1, Number(q.get('days')) || 7))));
}
