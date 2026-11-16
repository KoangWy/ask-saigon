import { publicApi } from '../../../../lib/http';
import { prices } from '../../../../lib/publicapi';
export const runtime = 'nodejs';
export const GET = (req: Request) => publicApi(req, prices);
export const OPTIONS = (req: Request) => publicApi(req, prices);
