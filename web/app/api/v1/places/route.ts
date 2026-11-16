import { publicApi } from '../../../../lib/http';
import { places } from '../../../../lib/publicapi';
export const runtime = 'nodejs';
export const GET = (req: Request) => publicApi(req, places);
export const OPTIONS = (req: Request) => publicApi(req, places);
