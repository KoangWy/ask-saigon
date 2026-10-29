import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { inServiceArea } from '../lib/geo';
import { parseHours } from '../lib/hours';
const placeColumns = 'id,ten_vi,ten_en,ten_khac,loai,khu,dia_chi,lat,lng,gio_mo,gia_tu,gia_den,mo_ta_vi,mo_ta_en,tag,thoi_gian_tham_quan,trang_thai,google_place_id,cau_chuyen_vi,cau_chuyen_en,nhin_ky_vi,nhin_ky_en,anh_url,anh_nguon,nguon,ngay_kiem'.split(',');
const priceColumns = 'id,hang_muc,ten_khac,don_vi,gia_tu,gia_den,meo_vi,meo_en,nguon,ngay_kiem'.split(',');
const nonempty = z.string().min(1, 'required');
const numeric = z.string().refine(v=>v!=='' && Number.isFinite(Number(v)), 'must be a number');
const optionalNumber = z.string().refine(v=>v==='' || (Number.isFinite(Number(v)) && Number(v)>=0), 'must be a nonnegative number');
const schema = z.object({id:nonempty,nguon:z.url(),ngay_kiem:z.iso.date()});
const placeSchema = schema.extend({ten_vi:nonempty,ten_en:nonempty,loai:z.enum(['di_tich','quan_an','ca_phe','diem_dem','trong_nha','giao_thong']),khu:z.enum(['Q1','Q3']),dia_chi:nonempty,lat:numeric,lng:numeric,gio_mo:z.string().refine(v=>{try {parseHours(v);return true;}catch{return false;}},'invalid hours grammar'),gia_tu:optionalNumber,gia_den:optionalNumber,thoi_gian_tham_quan:numeric,trang_thai:z.enum(['hoat_dong','dong_cua_vinh_vien'])});
const priceSchema=schema.extend({hang_muc:nonempty,gia_tu:optionalNumber,gia_den:optionalNumber});
for (const [name, columns, validator] of [['dia_diem',placeColumns,placeSchema],['gia_tham_khao',priceColumns,priceSchema]] as const) {
 const filename=`data/${name}.csv`; const records=parse(readFileSync(filename,'utf8'),{columns:true,skip_empty_lines:true,info:true}) as {record:Record<string,string>;info:{lines:number}}[]; const output=[]; const ids=new Set<string>();
 for (const {record,info} of records) {
  for (const column of columns) if (!(column in record)) throw new Error(`${filename} line 1 › ${column}: missing column`);
  const result=validator.safeParse(record); if (!result.success) {const issue=result.error.issues[0]; throw new Error(`${filename} line ${info.lines} › ${issue.path.join('.')}: ${issue.message}`);}
  if(record.gia_tu&&record.gia_den&&Number(record.gia_tu)>Number(record.gia_den)) throw new Error(`${filename} line ${info.lines} › gia_den: must be at least gia_tu`);
  if(name==='dia_diem'&&Number(record.thoi_gian_tham_quan)<=0) throw new Error(`${filename} line ${info.lines} › thoi_gian_tham_quan: must be positive`);
  if(ids.has(record.id)) throw new Error(`${filename} line ${info.lines} › id: duplicate`); ids.add(record.id);
  if(name==='dia_diem' && !inServiceArea({lat:Number(record.lat),lng:Number(record.lng)})) throw new Error(`${filename} line ${info.lines} › lat/lng: outside Q1 and Q3 bounds`);
  output.push(record);
 }
 mkdirSync('lib/data/generated',{recursive:true}); writeFileSync(`lib/data/generated/${name}.json`,JSON.stringify(output,null,2)+'\n');
}
