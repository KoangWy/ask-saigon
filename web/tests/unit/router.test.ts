import { afterEach, describe, expect, it, vi } from 'vitest';
import { routeChat } from '../../lib/router';
import { ChatRequestSchema, ReplySchema, SampleIdSchema } from '../../lib/schema';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
const state={lang:'en',location:{lat:10.772,lng:106.698,label:'Ben Thanh',source:'picked'},now:'2026-10-30T12:00:00Z',offline:true};
describe('offline router',()=>{it('returns a valid card for each sample',async()=>{for(const sample_id of SampleIdSchema.options){const reply=await routeChat(ChatRequestSchema.parse({input:{kind:'sample',sample_id},history:[],state}),'test');expect(ReplySchema.safeParse(reply).success).toBe(true);expect(reply.blocks.length).toBeGreaterThan(0);}});it('falls back without exposing credentials on provider failure',async()=>{vi.stubEnv('LLM_API_KEY','secret-value');vi.stubEnv('AI_MODE','on');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('secret-value',{status:401})));const reply=await routeChat(ChatRequestSchema.parse({input:{kind:'sample',sample_id:'nearby-benthanh'},history:[],state:{...state,offline:false}}),'failure-test');expect(reply.source).toBe('canned');expect(JSON.stringify(reply)).not.toContain('secret-value');});it('warns for a near-cap budget and uses a sample itinerary',async()=>{const reply=await routeChat(ChatRequestSchema.parse({input:{kind:'sim',sim:'budget_near'},history:[],state}),'test');expect(reply.blocks[0]).toMatchObject({type:'budget',spent:736,cap:800,warning:true});});});

it('omits an empty group replan when there are no swaps',async()=>{
 const reply=await routeChat(ChatRequestSchema.parse({input:{kind:'group_vote'},history:[],state:{...state,itinerary:{date:'2026-10-30',budget:800,total_cost:0,days:[{stops:[],legs:[]}]}}}),'empty-vote');
 expect(reply.blocks.some(block=>block.type==='replan')).toBe(false);
});
