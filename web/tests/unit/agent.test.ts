import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAgent } from '../../lib/agent';
import { routeChat } from '../../lib/router';
import { TIKTOK_FOUND_SAMPLE_CAPTION, TIKTOK_FOUND_SAMPLE_URL } from '../../lib/tiktok-samples';
import type { ChatRequest } from '../../lib/schema';
const base:ChatRequest={input:{kind:'text',text:'Find places'},history:[],state:{lang:'en',location:{lat:10.7724,lng:106.698,label:'Ben Thanh',source:'picked'},now:'2026-10-30T12:00:00Z',offline:false}};
const response=(message:unknown)=>new Response(JSON.stringify({choices:[{message}]}),{status:200});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('agent tool loop',()=>{it('runs parallel tools and returns cards',async()=>{vi.stubEnv('LLM_API_KEY','secret-value');const fetchMock=vi.fn().mockResolvedValueOnce(response({content:null,tool_calls:[{id:'1',function:{name:'search_places',arguments:'{}'}},{id:'2',function:{name:'get_story',arguments:'{"place_id":"q1-001"}'}}]})).mockResolvedValueOnce(response({content:'Here are ideas.'}));vi.stubGlobal('fetch',fetchMock);const reply=await runAgent(base);expect(reply.blocks.map(b=>b.type)).toEqual(expect.arrayContaining(['place_cards','story']));expect(fetchMock).toHaveBeenCalledTimes(2);expect(JSON.stringify(reply)).not.toContain('secret-value');});it('passes image data as an image URL',async()=>{const fetchMock=vi.fn().mockResolvedValue(response({content:'Menu read.'}));vi.stubGlobal('fetch',fetchMock);await runAgent({...base,input:{kind:'image',media_type:'image/jpeg',data_b64:'YWJj'}});const sent=JSON.parse(fetchMock.mock.calls[0][1].body);expect(sent.messages.at(-1).content).toContainEqual({type:'image_url',image_url:{url:'data:image/jpeg;base64,YWJj'}});});it('rejects a refusal',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response({content:null,refusal:'No'})));await expect(runAgent(base)).rejects.toThrow('refused');});});

it('uses the real found TikTok sample and leads with its verified place result',async()=>{
 vi.stubEnv('AI_MODE','on');vi.stubEnv('LLM_API_KEY','test-key');
 const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({title:TIKTOK_FOUND_SAMPLE_CAPTION,author_name:'Bánh mì Huynh Hoa',thumbnail_url:''}),{status:200,headers:{'content-type':'application/json'}}));
 vi.stubGlobal('fetch',fetchMock);
 const reply=await routeChat({...base,input:{kind:'sample',sample_id:'tiktok-found'}},'tiktok-found-unit-test');
 const result=reply.blocks.find(block=>block.type==='tiktok_result');
 expect(reply.source).toBe('agent');
 expect(result).toMatchObject({type:'tiktok_result',tiktok_url:TIKTOK_FOUND_SAMPLE_URL,video_title:TIKTOK_FOUND_SAMPLE_CAPTION,status:'found',place:{id:'q1-018'}});
 expect(reply.blocks.some(block=>block.type==='place_cards'&&block.places.some(place=>place.id==='q1-018'))).toBe(true);
 expect(reply.reply_text).toMatch(/^That video is Huynh Hoa Banh Mi at .*open now until 22:00\./);
 expect(fetchMock).toHaveBeenCalledTimes(1);
 expect(String(fetchMock.mock.calls[0][0])).toContain('https://www.tiktok.com/oembed');
});
