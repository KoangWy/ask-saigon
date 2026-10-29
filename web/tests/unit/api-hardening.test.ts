import { expect, it } from 'vitest';
import { POST } from '../../app/api/chat/route';
import { GET } from '../../app/api/health/route';
it('rejects wrong media types and cross-site requests',async()=>{const request=(headers:Record<string,string>)=>new Request('https://example.test/api/chat',{method:'POST',headers,body:'{}'});expect((await POST(request({'content-type':'text/plain'}))).status).toBe(415);expect((await POST(request({'content-type':'application/json','sec-fetch-site':'cross-site'}))).status).toBe(403);expect((await POST(request({'content-type':'application/json','origin':'https://evil.test'}))).status).toBe(403)});
it('health does not expose model or credentials',async()=>{expect(Object.keys(await GET().json()).sort()).toEqual(['ai','ok'])});
