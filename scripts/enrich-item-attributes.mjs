import fs from 'node:fs/promises';

const ITEMS='data/items.json';
const OUT='data/item-attribute-grades.json';
const BASE='https://annie-nikki.homes/items/';
const ATTRS=[
  ['gorgeous','Quý phái'],['simple','Đơn giản'],['elegant','Thanh lịch'],['lively','Năng động'],['mature','Trưởng thành'],
  ['cute','Dễ thương'],['sexy','Gợi cảm'],['pure','Trong sáng'],['warm','Giữ ấm'],['cool','Mát mẻ']
];
const GRADES=new Set(['SS','S','A','B','C','D','E','—','-']);
const CONCURRENCY=Math.max(4,Math.min(24,Number(process.env.CONCURRENCY||16)));
const TIMEOUT=Number(process.env.TIMEOUT||20000);
const FORCE=process.env.FORCE_REFRESH==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cleanHtml=s=>String(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function grade(text,label){
  const re=new RegExp(escRe(label)+'\\s*([A-Za-z]{1,2}|—|-)','i');
  const m=text.match(re); if(!m)return null;
  const g=m[1].toUpperCase(); return GRADES.has(g)?(g==='-'?'—':g):null;
}
function parse(text,id){
  const grades={}; let found=0;
  for(const [key,label] of ATTRS){const g=grade(text,label); grades[key]=g; if(g&&g!=='—')found++;}
  return {id,grades,attributeCount:found,sourceUrl:BASE+encodeURIComponent(id)};
}
async function fetchOne(id){
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),TIMEOUT);
  try{
    const r=await fetch(BASE+encodeURIComponent(id),{signal:c.signal,headers:{'user-agent':'Aetheria-Attribute-Scanner/1.0','accept':'text/html'}});
    if(!r.ok)return null;
    const text=cleanHtml(await r.text());
    return parse(text,id);
  }catch{return null}finally{clearTimeout(t)}
}
const raw=JSON.parse(await fs.readFile(ITEMS,'utf8'));
const items=Array.isArray(raw.items)?raw.items:raw;
let old={}; try{old=JSON.parse(await fs.readFile(OUT,'utf8')).items||{}}catch{}
const ids=[...new Set(items.map(x=>String(x.id)).filter(Boolean))];
const todo=FORCE?ids:ids.filter(id=>!old[id]||Object.values(old[id].grades||{}).every(v=>v==null||v==='—'));
const data={...old}; let done=0,ok=0,withAny=0;
console.log(`Aetheria attribute scan: ${todo.length}/${ids.length} item; concurrency=${CONCURRENCY}; force=${FORCE}`);
for(let i=0;i<todo.length;i+=CONCURRENCY){
  const batch=todo.slice(i,i+CONCURRENCY);
  const vals=await Promise.all(batch.map(async id=>[id,await fetchOne(id)]));
  for(const [id,row] of vals){done++;if(row){data[id]=row;ok++;if(row.attributeCount>0)withAny++;}}
  console.log(`Attributes: ${done}/${todo.length} fetched; ${ok} parsed; ${withAny} with at least one grade`);
  await sleep(100);
}
const complete=ids.filter(id=>Object.values(data[id]?.grades||{}).filter(v=>v&&v!=='—').length===10).length;
const any=ids.filter(id=>Object.values(data[id]?.grades||{}).some(v=>v&&v!=='—')).length;
const out={version:1,locale:'vi-VN',game:'Ngôi Sao Thời Trang VNG',source:'Annie Nikki Homes — public Vietnamese item pages',sourceUrl:'https://annie-nikki.homes/items',attributeScale:'Displayed in-game-style letter grades; no numeric score is invented.',gradeOrder:['SS','S','A','B','C','D','E','—'],scannedAt:new Date().toISOString(),itemCount:ids.length,coverage:{withAnyAttributes:any,withAllAttributes:complete},items:data};
await fs.writeFile(OUT,JSON.stringify(out,null,2)+'\n');
console.log(`DONE: ${any}/${ids.length} have attributes; ${complete}/${ids.length} have all 10.`);
