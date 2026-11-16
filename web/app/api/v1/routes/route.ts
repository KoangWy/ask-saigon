import { publicApi } from '../../../../lib/http';
import { routes } from '../../../../lib/publicapi';
export const runtime = 'nodejs';
export const GET = (req: Request) => publicApi(req, routes);
export const OPTIONS = (req: Request) => publicApi(req, routes);
