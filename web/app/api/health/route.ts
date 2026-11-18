import { hasLlmKey } from '../../../lib/llm/config';
import { persistent } from '../../../lib/store';
export const runtime='nodejs';
export function GET(){return Response.json({ok:true,ai:process.env.AI_MODE!=='off'&&hasLlmKey()?'on':'off',store:persistent?'redis':'memory'});}
