import { rainWindow } from '../../../lib/weather';
export const runtime = 'nodejs';
export async function GET() { return Response.json(await rainWindow()); }
