import { describe, expect, it } from 'vitest';
import { routeChat } from '../../lib/router';
import { ChatRequestSchema, ReplySchema, SampleIdSchema } from '../../lib/schema';
const state={lang:'en',location:{lat:10.772,lng:106.698,label:'Ben Thanh',source:'picked'},now:'2026-10-30T12:00:00Z',offline:true};
describe('offline router',()=>{it('returns a valid card for each sample',async()=>{for(const sample_id of SampleIdSchema.options){const reply=await routeChat(ChatRequestSchema.parse({input:{kind:'sample',sample_id},history:[],state}),'test');expect(ReplySchema.safeParse(reply).success).toBe(true);expect(reply.blocks.length).toBeGreaterThan(0);}});it('warns for a near-cap budget and uses a sample itinerary',async()=>{const reply=await routeChat(ChatRequestSchema.parse({input:{kind:'sim',sim:'budget_near'},history:[],state}),'test');expect(reply.blocks[0]).toMatchObject({type:'budget',spent:736,cap:800,warning:true});});});
