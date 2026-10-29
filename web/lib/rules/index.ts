import places from '../data/generated/dia_diem.json';
import { openingStatus } from '../hours';
import prices from '../data/generated/gia_tham_khao.json';
import { haversine, travelEstimate } from '../geo';
import type { Itinerary, Block } from '../schema';
type Stop=Itinerary['days'][number]['stops'][number];
const minutes=(t:string)=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
const clock=(n:number)=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export function replan(plan:Itinerary,reason:'rain'|'late40',dataset:typeof places=places,now:Date=new Date()):Extract<Block,{type:'replan'}> {
 const before=plan.days.flatMap(day=>day.stops);
 const after:Stop[]=[];
 const dropped:Stop[]=[];
 if(reason==='late40'){
  for(const stop of before){
   const arrive=minutes(stop.arrive)+40,leave=minutes(stop.leave)+40,p=dataset.find(x=>x.id===stop.place_id);
   const closed=p?.gio_mo&&openingStatus(p.gio_mo,new Date(`${plan.date}T${clock(leave)}:00+07:00`)).open_now===false;
   if((leave>21*60||closed)&&!plan.must_visit?.includes(stop.place_id))dropped.push(stop);
   else after.push({...stop,arrive:clock(arrive),leave:clock(leave)});
  }
 }else{
  const isOutdoor=(stop:Stop)=>{const place=dataset.find(row=>row.id===stop.place_id);return !!place&&!place.tag.split(';').map(tag=>tag.trim()).includes('trong_nha');};
  let rainStart=14*60;
  const fixedWindowHasOutdoor=before.some(stop=>isOutdoor(stop)&&minutes(stop.arrive)<16*60&&minutes(stop.leave)>14*60);
  if(!fixedWindowHasOutdoor){
   const localNow=new Date(now.getTime()+7*60*60*1000);
   const nowMinute=localNow.getUTCHours()*60+localNow.getUTCMinutes();
   const firstOutdoor=before.filter(stop=>isOutdoor(stop)&&minutes(stop.arrive)>=nowMinute).sort((a,b)=>minutes(a.arrive)-minutes(b.arrive))[0];
   if(firstOutdoor)rainStart=minutes(firstOutdoor.arrive);
  }
  const rainEnd=rainStart+120;
  const rainy=before.filter(stop=>isOutdoor(stop)&&minutes(stop.arrive)<rainEnd&&minutes(stop.leave)>rainStart);
  after.push(...before.filter(stop=>!rainy.includes(stop)));
  for(const stop of rainy){
   const duration=minutes(stop.leave)-minutes(stop.arrive);
   const start=Math.max(rainEnd,after.length?minutes(after.at(-1)!.leave):rainEnd);
   const place=dataset.find(row=>row.id===stop.place_id);
   if(start+duration<=21*60&&place?.gio_mo&&openingStatus(place.gio_mo,new Date(`${plan.date}T${clock(start+duration)}:00+07:00`)).open_now){
    after.push({...stop,arrive:clock(start),leave:clock(start+duration)});
   }else if(plan.must_visit?.includes(stop.place_id)){
    after.push({...stop,arrive:clock(start),leave:clock(start+duration)});
   }else{
    const at=new Date(`${plan.date}T${stop.arrive}:00+07:00`);
    const candidates=dataset.filter(candidate=>candidate.trang_thai==='hoat_dong'&&candidate.tag.split(';').map(tag=>tag.trim()).includes('trong_nha')&&!before.some(item=>item.place_id===candidate.id)&&!after.some(item=>item.place_id===candidate.id)&&candidate.gio_mo&&openingStatus(candidate.gio_mo,at).open_now===true&&openingStatus(candidate.gio_mo,new Date(at.getTime()+duration*60000)).open_now===true);
    candidates.sort((a,b)=>place?haversine({lat:+place.lat,lng:+place.lng},{lat:+a.lat,lng:+a.lng})-haversine({lat:+place.lat,lng:+place.lng},{lat:+b.lat,lng:+b.lng}):a.id.localeCompare(b.id));
    const replacement=candidates[0];
    dropped.push(stop);
    if(replacement)after.push({...stop,place_id:replacement.id,name:replacement.ten_en,est_cost:replacement.gia_tu&&replacement.gia_den?(+replacement.gia_tu + +replacement.gia_den)/2:0});
   }
  }
  after.sort((a,b)=>minutes(a.arrive)-minutes(b.arrive));
  return {type:'replan',reason:`rain ${clock(rainStart)}-${clock(rainEnd)}`,before,after,dropped};
 }
 return {type:'replan',reason,before,after,dropped};
}
function groupVoteSelection(plan:Itinerary,dataset:typeof places=places):{block:Extract<Block,{type:'group_vote'}>;replacementFor:Map<string,string>}{
 const replacementFor=new Map<string,string>();const members=['Alex','Linh','Sam'];const stops=plan.days.flatMap(d=>d.stops);const votes=stops.flatMap(s=>{const p=dataset.find(p=>p.id===s.place_id);return members.map(member=>({place_id:s.place_id,member,vote:(member==='Alex'&&p?.loai==='di_tich'&&Number(p.thoi_gian_tham_quan)>60||member==='Linh'&&(p?.loai==='diem_dem'||p?.loai==='di_tich'&&Number(p.thoi_gian_tham_quan)>60)?'down':'up') as 'up'|'down'}));});const kept=stops.filter(s=>votes.filter(v=>v.place_id===s.place_id&&v.vote==='up').length>=2);const result=[...kept.map(s=>s.place_id)];
 for(const rejected of stops.filter(s=>!kept.some(k=>k.place_id===s.place_id))){const original=dataset.find(p=>p.id===rejected.place_id);if(!original)continue;const candidates=dataset.filter(p=>p.id!==original.id&&p.trang_thai==='hoat_dong'&&p.loai===original.loai&&p.gio_mo&&openingStatus(p.gio_mo,new Date(`${plan.date}T${rejected.arrive}:00+07:00`)).open_now===true&&!stops.some(s=>s.place_id===p.id)&&!result.includes(p.id)).filter(p=>!(p.loai==='di_tich'&&Number(p.thoi_gian_tham_quan)>60)&&p.loai!=='diem_dem').sort((a,b)=>haversine({lat:+a.lat,lng:+a.lng},{lat:+original.lat,lng:+original.lng})-haversine({lat:+b.lat,lng:+b.lng},{lat:+original.lat,lng:+original.lng})||a.id.localeCompare(b.id));const replacement=candidates[0];if(replacement){replacementFor.set(rejected.place_id,replacement.id);result.push(replacement.id);for(const member of members)votes.push({place_id:replacement.id,member,vote:'up'});}}
 return {block:{type:'group_vote',members,votes,result},replacementFor};
}
export function groupVote(plan:Itinerary,dataset:typeof places=places):Extract<Block,{type:'group_vote'}>{return groupVoteSelection(plan,dataset).block;}
export function groupVoteWithItinerary(plan:Itinerary,dataset:typeof places=places):{block:Extract<Block,{type:'group_vote'}>;itinerary:Itinerary;swaps:{before_place_id:string;after_place_id:string}[]}{
 const {block,replacementFor}=groupVoteSelection(plan,dataset),swaps:{before_place_id:string;after_place_id:string}[]=Array.from(replacementFor,([before_place_id,after_place_id])=>({before_place_id,after_place_id}));
 const priceFor=(placeId:string)=>{const place=dataset.find(row=>row.id===placeId);return place?.gia_tu&&place.gia_den?(+place.gia_tu + +place.gia_den)/2:0;};
 const ride=prices.find(row=>row.id.includes('bike')&&row.gia_tu&&row.gia_den),rideCost=ride?(+ride.gia_tu + +ride.gia_den)/2:0;
 let total=0;
 const days=plan.days.map(day=>{
  const sourceStops=day.stops.flatMap(stop=>{const placeId=replacementFor.get(stop.place_id)??stop.place_id;if(!block.result.includes(placeId))return [];const place=dataset.find(row=>row.id===placeId);return [{stop,placeId,name:place?.ten_en??stop.name,replaced:placeId!==stop.place_id}];});
  const stops:Stop[]=[],legs:Itinerary['days'][number]['legs']=[];let previousPlace:typeof dataset[number]|undefined,previousLeave=0;
  for(const item of sourceStops){
   const place=dataset.find(row=>row.id===item.placeId),oldStart=minutes(item.stop.arrive),duration=Math.max(0,minutes(item.stop.leave)-oldStart);
   const leg=previousPlace&&place?travelEstimate({lat:+previousPlace.lat,lng:+previousPlace.lng},{lat:+place.lat,lng:+place.lng}):null;
   const arrive=leg?Math.max(oldStart,previousLeave+leg.minutes):oldStart,leave=arrive+duration;
   const stopCost=item.replaced?priceFor(item.placeId):priceFor(item.placeId)||item.stop.est_cost;
   if(leg){legs.push({from:stops.at(-1)!.place_id,to:item.placeId,...leg});if(leg.mode==='driving')total+=rideCost;}
   stops.push({...item.stop,place_id:item.placeId,name:item.name,arrive:clock(arrive),leave:clock(leave),est_cost:stopCost});
   total+=stopCost;previousPlace=place;previousLeave=leave;
  }
  return {...day,stops,legs};
 });
 return {block,itinerary:{...plan,days,total_cost:total},swaps};
}
export function budget(plan:Itinerary):Extract<Block,{type:'budget'}> {const cap=plan.budget??800;const next=plan.days.flatMap(d=>d.stops)[0];const place=places.find(p=>p.id===next?.place_id);const options=place?places.filter(p=>p.id!==place.id&&p.loai===place.loai&&p.gia_tu&&p.gia_den&&place.gia_tu&&place.gia_den&&(+p.gia_tu + +p.gia_den)<(+place.gia_tu + +place.gia_den)).filter(p=>haversine({lat:+p.lat,lng:+p.lng},{lat:+place.lat,lng:+place.lng})<1000).map(p=>p.ten_en).slice(0,3):[];const planned=plan.days.flatMap(d=>d.stops).reduce((sum,stop)=>sum+stop.est_cost,0);const spent=cap*.92;return {type:'budget',spent,planned,cap,warning:spent+planned>=cap*.9,cheaper_options:options};}
export function contextPrompt(now:Date,lang:'en'|'vi'):Extract<Block,{type:'context_prompt'}>|null {const date=new Date(now.getTime()+7*3600000),minute=date.getUTCHours()*60+date.getUTCMinutes();if(!((minute>=690&&minute<=780)||(minute>=1080&&minute<=1200)))return null;return lang==='vi'?{type:'context_prompt',question:'Gần đến giờ ăn rồi. Bạn đói chưa?',options:['Có, gần đây','Chưa','Món mát']}:{type:'context_prompt',question:"It's almost mealtime. Hungry?",options:['Yes, nearby','Not yet','Something cool']};}
