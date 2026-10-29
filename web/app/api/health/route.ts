export const runtime='nodejs';
export function GET(){return Response.json({ok:true,ai:process.env.AI_MODE!=='off'&&!!process.env.LLM_API_KEY?'on':'off'});}
