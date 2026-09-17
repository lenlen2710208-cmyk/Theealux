import fs from 'node:fs/promises';

const ITEMS='data/items.json';
const OUT='data/vietnamese-names.json';
const BASE='https://annie-nikki.homes/items/';
const CONCURRENCY=10;
const TIMEOUT=15000;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const htmlTitle=html=>{
  const m=html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    ||html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.replace(/\s+/g,' ').trim()||'';
};
const clean=s=>s.replace(/^Annie Nikki Homes\s*[-|]\s*/i,'').trim();

async function fetchName(id){
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(),TIMEOUT);
  try{
    const r=await fetch(BASE+encodeURIComponent(id),{signal:c.signal,headers:{'user-agent':'Aetheria-VNG-name-sync/1.0'}});
    if(!r.ok)return null;
    const title=clean(htmlTitle(await r.text()));
    return title&&title!=='Kho đồ'&&title!=='Ngôi Sao Thời Trang'?title:null;
  }catch{return null}finally{clearTimeout(t)}
}

const raw=JSON.parse(await fs.readFile(ITEMS,'utf8'));
const items=Array.isArray(raw.items)?raw.items:raw;
let old={};
try{old=JSON.parse(await fs.readFile(OUT,'utf8')).names||{}}catch{}
const ids=[...new Set(items.map(x=>String(x.id)).filter(Boolean))];
const names={...old};
let done=0,found=0;

for(let i=0;i<ids.length;i+=CONCURRENCY){
  const batch=ids.slice(i,i+CONCURRENCY);
  const vals=await Promise.all(batch.map(async id=>[id,await fetchName(id)]));
  for(const [id,name] of vals){
    if(name){names[id]=name;found++}
    done++;
  }
  console.log(`Aetheria VN names: ${done}/${ids.length} (new/confirmed ${found})`);
  await sleep(150);
}

const out={
  version:2,
  locale:'vi-VN',
  source:'Annie Nikki Homes — public Vietnamese item pages',
  sourceUrl:'https://annie-nikki.homes/items',
  policy:'Ưu tiên tên tiếng Việt công khai theo từng ID item. Không tự dịch/bịa tên; item chưa tìm được tên Việt được giữ nguyên dữ liệu gốc.',
  verifiedAt:new Date().toISOString().slice(0,10),
  itemCount:ids.length,
  matchedCount:Object.keys(names).length,
  names
};
await fs.writeFile(OUT,JSON.stringify(out,null,2)+'\n');
console.log(`DONE: ${Object.keys(names).length}/${ids.length} item có tên Việt.`);
