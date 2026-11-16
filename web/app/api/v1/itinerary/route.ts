import { publicApi } from '../../../../lib/http';
import { itinerary } from '../../../../lib/publicapi';
export const runtime = 'nodejs';
export const GET = (req: Request) => publicApi(req, itinerary);
export const OPTIONS = (req: Request) => publicApi(req, itinerary);
