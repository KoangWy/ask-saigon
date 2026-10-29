const base=process.argv[2]??'http://localhost:3000';
const ids=['tiktok-found','tiktok-noname','tiktok-closed','menu-1','menu-2','price-cyclo','nearby-benthanh','plan-d1-night'];
async function main(){ for(const sample_id of ids){const start=Date.now();try{const response=await fetch(`${base}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:{kind:'sample',sample_id},history:[],state:{lang:'en',location:{lat:10.7724,lng:106.698,label:'Ben Thanh',source:'picked'},now:new Date().toISOString(),offline:false},session_id:crypto.randomUUID()})});const body=await response.json();console.log(`${sample_id}: ${Date.now()-start}ms ${body.source??response.status}`);}catch{console.log(`${sample_id}: failed`);}}

}
void main();
export {};
