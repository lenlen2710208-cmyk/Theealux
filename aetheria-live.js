(()=>{'use strict';
/* Aetheria live-data layer r20260917-1
   - Reads the same verified VNG item/stage datasets as the main runtime.
   - Adds stage-aware slot rankings without inventing scores.
   - Keeps foreign/unreleased Chapter 3 out of the Vietnamese gameplay view.
   - Community reports are treated as leads, not truth, until verified. */
const ATTR=['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'];
const LABEL={gorgeous:'Quý phái',simple:'Đơn giản',elegant:'Thanh lịch',lively:'Năng động',mature:'Trưởng thành',cute:'Dễ thương',sexy:'Gợi cảm',pure:'Trong sáng',warm:'Giữ ấm',cool:'Mát mẻ'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cat=x=>String(x.category||x.typeName||x.type||'Chưa phân loại');
let ITEMS=[],STAGES=[];
function attrs(s){return s?.attrs||s?.attributes||{}}
function score(x,s){return ATTR.reduce((n,k)=>n+(+x[k]||0)*(+attrs(s)[k]||0),0)}
function group(g){const aliases={quyen1:['quyen1'],quyen2:['quyen2'],aihoi:['aihoi'],thidau:['thidau','competition']};const a=aliases[g]||[g];return STAGES.filter(s=>a.includes(String(s.group||'').toLowerCase()))}
function stage(){return STAGES.find(s=>String(s.id)==String(document.querySelector('#rankStageSelect')?.value))}
function enhanceInfo(s){
 const old=document.querySelector('#rankDescription'); if(!old||!s)return;
 const tags=Array.isArray(s.tags)?s.tags:[];
 const w=ATTR.map(k=>[k,+attrs(s)[k]||0]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
 old.innerHTML=`<b>${esc(s.label||s.name||s.id)}</b> · ${w.slice(0,2).map(x=>LABEL[x[0]]).join(' + ')||'chưa có trọng số'}${tags.length?` · Tag: ${tags.map(esc).join(' · ')}`:''}<br><small>Top được tính theo trọng số thuộc tính của chặng/theme. Đây là chỉ số tham khảo, không phải điểm trận đấu.</small>`;
}
function slotRank(){
 const s=stage(),root=document.querySelector('#rankingGrid'); if(!s||!root)return;
 const limit=+(document.querySelector('#rankLimit')?.value||20), selected=document.querySelector('#rankCategory')?.value||'all';
 let rows=ITEMS.filter(x=>ATTR.some(k=>(+x[k]||0)>0)&&(selected==='all'||cat(x)===selected)).map(x=>({...x,__score:score(x,s)})).filter(x=>x.__score>0).sort((a,b)=>b.__score-a.__score||(+b.rarity||0)-(+a.rarity||0));
 const cats=[...new Set(rows.map(cat))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
 let panel=document.querySelector('#aetheriaSlotPanel');
 if(!panel){panel=document.createElement('div');panel.id='aetheriaSlotPanel';panel.className='aetheria-slot-panel';root.parentNode.insertBefore(panel,root)}
 const active=panel.dataset.active||'all';
 panel.innerHTML=`<div class="aetheria-slot-head"><div><b>Top theo từng loại đồ</b><small>${esc(s.label||s.name||s.id)}</small></div><div class="aetheria-slot-tabs"><button data-slot="all" class="${active==='all'?'active':''}">Tổng hợp</button>${cats.slice(0,18).map(c=>`<button data-slot="${esc(c)}" class="${active===c?'active':''}">${esc(c)}</button>`).join('')}</div></div>`;
 panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{panel.dataset.active=b.dataset.slot;slotRank()});
 let view=active==='all'?rows:rows.filter(x=>cat(x)===active);
 root.innerHTML=view.slice(0,limit).map((x,i)=>`<article class="item-card rank-card" data-item-id="${esc(x.id)}"><div class="item-img"><img loading="lazy" src="${esc(x.image||'')}" alt="${esc(x.name)}" onerror="this.style.opacity=.25"><div class="rank-no">#${i+1}</div></div><div class="item-body"><div class="rank-name">${esc(x.name||'Chưa đặt tên')}</div><div class="meta">${esc(cat(x))}${x.suit?' • '+esc(x.suit):''}</div><div class="item-meta"><span class="score">${x.__score.toLocaleString('vi-VN',{maximumFractionDigits:1})} phù hợp</span></div></div></article>`).join('')||'<div class="empty">Không có item phù hợp.</div>';
 enhanceInfo(s);
 const info=document.querySelector('#rankInfo'); if(info)info.textContent=`${s.label||s.name||s.id} • ${view.length.toLocaleString('vi-VN')} item phù hợp • Top ${Math.min(limit,view.length)}`;
}
async function boot(){
 try{
  const [a,b,c]=await Promise.all([fetch('./data/items.json?live=20260917',{cache:'no-store'}),fetch('./data/stages.json?live=20260917',{cache:'no-store'}),fetch('./data/stages-extra.json?live=20260917',{cache:'no-store'})]);
  const p=await a.json(),q=await b.json(); ITEMS=Array.isArray(p.items)?p.items:Array.isArray(p)?p:[]; STAGES=Array.isArray(q.stages)?q.stages:[];
  if(c.ok){const z=await c.json();const seen=new Set(STAGES.map(x=>x.id));for(const x of(z.stages||[]))if(!seen.has(x.id))STAGES.push(x)}
  const btn=document.querySelector('#rankDescription'); if(btn&&!document.querySelector('#aetheriaDataNote')){const n=document.createElement('div');n.id='aetheriaDataNote';n.className='aetheria-data-note';n.textContent=`Nguồn dữ liệu hiện tại: ${ITEMS.length.toLocaleString('vi-VN')} item · chặng/theme đã có trong kho. Cập nhật mới cần được xác minh trước khi đưa vào BXH.`;btn.insertAdjacentElement('afterend',n)}
  setTimeout(()=>{const s=stage();if(s)slotRank()},350);
  ['rankStageSelect','rankLimit','rankCategory'].forEach(id=>document.querySelector('#'+id)?.addEventListener('change',()=>setTimeout(slotRank,40)));
  document.querySelectorAll('#rankTabs button').forEach(b=>b.addEventListener('click',()=>setTimeout(slotRank,60)));
  document.querySelector('#rankChapterSelect')?.addEventListener('change',()=>setTimeout(slotRank,60));
 }catch(e){console.warn('[Aetheria live]',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
