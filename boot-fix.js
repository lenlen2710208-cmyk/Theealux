/* Aetheria emergency data boot: keeps the wardrobe visible even if a legacy UI handler fails. */
(function(){
const DATA='./data/items.json';
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]||c));
const FALLBACK='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22760%22%3E%3Crect width=%22600%22 height=%22760%22 fill=%22%23f0e1db%22/%3E%3Ccircle cx=%22300%22 cy=%22250%22 r=%22100%22 fill=%22%23c89aa3%22/%3E%3Cpath d=%22M150 650c20-140 75-220 150-220s130 80 150 220Z%22 fill=%22%23c89aa3%22/%3E%3C/svg%3E';
function category(x){return String(x.category||x.typeName||x.type||'Chưa phân loại').trim()||'Chưa phân loại'}
function card(x){const attrs=[['gorgeous','Hoa lệ'],['simple','Giản dị'],['elegant','Thanh lịch'],['lively','Năng động'],['mature','Trưởng thành'],['cute','Dễ thương'],['sexy','Quyến rũ'],['pure','Thuần khiết'],['warm','Ấm áp'],['cool','Mát mẻ']].map(([k,l])=>[l,Number(x[k])||0]).filter(a=>a[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3);return `<article class="item-card" data-item-id="${esc(x.id)}"><div class="item-img"><img loading="lazy" decoding="async" src="${esc(x.image||FALLBACK)}" alt="${esc(x.name)}" onerror="this.onerror=null;this.src='${FALLBACK}'"></div><div class="item-body"><div class="rank-name">${esc(x.name||'Chưa đặt tên')}</div><div class="meta">${esc(category(x))}${x.suit?` • ${esc(x.suit)}`:''}</div><div class="item-meta"><span class="rarity">${'★'.repeat(Math.min(5,Number(x.rarity)||0))}${'☆'.repeat(Math.max(0,5-(Number(x.rarity)||0)))}</span></div>${attrs.length?`<div class="attr-line">${attrs.map(a=>`${a[0]} ${a[1]}`).join(' • ')}</div>`:''}</div></article>`}
async function boot(){
 const grid=document.querySelector('#wardrobeGrid'); if(!grid)return;
 try{
  const r=await fetch(DATA,{cache:'no-store'}); if(!r.ok)throw Error('HTTP '+r.status); const d=await r.json(); const list=Array.isArray(d)?d:(d.items||[]);
  window.__aetheriaRawItems=list;
  const count=document.querySelector('#itemCount'); if(count)count.textContent=list.length.toLocaleString('vi-VN');
  const lc=document.querySelector('#libraryCount'); if(lc)lc.textContent=list.length.toLocaleString('vi-VN');
  const vc=document.querySelector('#visibleCount'); if(vc)vc.textContent=list.length.toLocaleString('vi-VN');
  const info=document.querySelector('#heroStatus'); if(info&&!info.querySelector('.boot-status')){const e=document.createElement('div');e.className='boot-status';e.textContent='✓ Kho dữ liệu đã tải • '+list.length.toLocaleString('vi-VN')+' bản ghi';info.appendChild(e)}
  let page=1,size=40,filtered=list;
  const render=()=>{const start=(page-1)*size;grid.innerHTML=filtered.slice(start,start+size).map(card).join('')||'<div class="empty">Không tìm thấy item.</div>';const pages=Math.max(1,Math.ceil(filtered.length/size));const pi=document.querySelector('#pageInfo');if(pi)pi.textContent=`Trang ${page} / ${pages}`;document.querySelector('#prevPage')?.toggleAttribute('disabled',page<=1);document.querySelector('#nextPage')?.toggleAttribute('disabled',page>=pages)};
  const filter=()=>{const q=(document.querySelector('#wardrobeSearch')?.value||'').toLowerCase().trim(),cat=document.querySelector('#categoryFilter')?.value||'all',rar=document.querySelector('#rarityFilter')?.value||'all';filtered=list.filter(x=>(!q||[x.name,x.suit,x.category,x.typeName,Array.isArray(x.tags)?x.tags.join(' '):''].join(' ').toLowerCase().includes(q))&&(cat==='all'||category(x)===cat)&&(rar==='all'||String(x.rarity||'')===rar));page=1;render();const v=document.querySelector('#visibleCount');if(v)v.textContent=filtered.length.toLocaleString('vi-VN')};
  document.querySelector('#wardrobeSearch')?.addEventListener('input',filter);document.querySelector('#categoryFilter')?.addEventListener('change',filter);document.querySelector('#rarityFilter')?.addEventListener('change',filter);document.querySelector('#prevPage')?.addEventListener('click',()=>{if(page>1){page--;render()}});document.querySelector('#nextPage')?.addEventListener('click',()=>{if(page<Math.ceil(filtered.length/size)){page++;render()}});
  render();
 }catch(e){grid.innerHTML='<div class="empty"><b>Không tải được kho item.</b><br>'+esc(e.message)+'</div>';console.error('Aetheria data boot failed',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
