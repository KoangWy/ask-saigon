import { describe, expect, it } from 'vitest';
import { openingStatus, parseHours } from '../../lib/hours';
import { haversine, travelEstimate } from '../../lib/geo';
import { canned } from '../../lib/canned';
import { ReplySchema, SampleIdSchema } from '../../lib/schema';
import { readTiktok } from '../../lib/tools';
describe('core',()=>{it('handles overnight hours in Vietnam time',()=>{expect(openingStatus('daily 17:00-02:00',new Date('2026-10-30T18:00:00Z')).open_now).toBe(true);expect(openingStatus('daily 17:00-02:00',new Date('2026-10-30T06:00:00Z')).open_now).toBe(false);});it('rejects invalid hours',()=>expect(()=>parseHours('daily 25:00-02:00')).toThrow());it('estimates travel',()=>{const a={lat:10.77,lng:106.69},b={lat:10.771,lng:106.69};expect(haversine(a,b)).toBeGreaterThan(100);expect(travelEstimate(a,b).mode).toBe('walking');});it('validates every canned reply',()=>{for(const id of SampleIdSchema.options)expect(ReplySchema.safeParse(canned(id)).success).toBe(true);});it('rejects non TikTok hosts',async()=>{await expect(readTiktok('https://tiktok.com.example.com/video')).rejects.toThrow();});});
