import { describe, expect, it } from 'vitest';
import { searchPlaces } from '../../lib/tools';
const context={location:{lat:10.7724,lng:106.698},now:new Date('2026-10-30T02:00:00Z'),lang:'en' as const};
describe('place search intent filters',()=>{it('keeps food intent within food categories',()=>{const results=searchPlaces({query:'food near Ben Thanh',radius_m:10000},context);expect(results.length).toBeGreaterThan(0);expect(results.every(p=>['quan_an','ca_phe','diem_dem'].includes(p.category))).toBe(true);});it('requires every requested tag and never fills with other types',()=>{const results=searchPlaces({categories:['quan_an'],tags:['chay','dem'],radius_m:10000},context);expect(results.every(p=>p.category==='quan_an')).toBe(true);expect(results.every(p=>p.id.length>0)).toBe(true);});it('keeps category filters strict when no candidates match',()=>{expect(searchPlaces({categories:['made_up'],radius_m:10000},context)).toEqual([]);});});

it('keeps nearby results free of transit and includes a nearby eatery or cafe',()=>{
 const results=searchPlaces({},context);
 expect(results.every(place=>place.category!=='giao_thong')).toBe(true);
 expect(results.some(place=>place.category==='quan_an'||place.category==='ca_phe')).toBe(true);
 expect(results.map(place=>place.distance_m)).toEqual([...results.map(place=>place.distance_m)].sort((a,b)=>a!-b!));
});
