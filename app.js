const DATA_URL = './data/items.json';
const TARGET_COUNT = 32561;
const FALLBACK_IMG = 'https://annie-nikki.homes/favicon.ico';
let items = [];
let currentRank = 'aihoi';
let wardrobe = JSON.parse(localStorage.getItem('theealux_wardrobe') || '[]');
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}
function esc(v=''){return String(v).replace(/[&<>\\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))}
function img(url){return `<img loading="lazy" alt="" src="${esc(url||FALLBACK_IMG)}" onerror="this.src='${FALLBACK_IMG}'">`}
function itemScore(x){
  if(Number.isFinite(Number(x.score))) return Number(x.score);
  const attrs=['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'];
  const sum=attrs.reduce((n,k)=>n+(Number(x[k])||0),0);
  return sum>0 ? sum : (Number(x.rarity)||0)*10;
}
function card(item,i){const on=wardrobe.includes(item.id);return `<article class="rank-card"><div class="item-img">${img(item.image)}</div><div class="rank-body"><div class="rank-no">#${i+1}</div><div class="rank-name">${esc(item.name)}</div><div class="meta">${esc(item.category||'Chưa phân loại')} • ${esc(item.suit||item.style||'')}</div><div class="rank-foot"><span class="score">${itemScore(item).toLocaleString('vi-VN')} điểm</span><button class="heart ${on?'on':''}" data-heart="${esc(item.id)}">${on?'♥':'♡'}</button></div></div></article>`}
function renderRank(){
  const grid=$('#rankingGrid');
  if(!items.length){grid.innerHTML='<div style="grid-column:1/-1;padding:34px;text-align:center;color:var(--muted)"><b>Đang chờ dữ liệu item.</b><br>Theealux sẽ hiển thị dữ liệu ngay khi đồng bộ hoàn tất.</div>';return}
  const base=[...items].filter(x=>itemScore(x)>0).sort((a,b)=>itemScore(b)-itemScore(a));
  grid.innerHTML=base.slice(0,20).map(card).join('')||'<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--muted)">Chưa có item phù hợp.</div>';
}
function renderWardrobe(){const q=$('#wardrobeSearch').value.toLowerCase();const cat=$('#categoryFilter').value;const owned=items.filter(x=>wardrobe.includes(x.id)&&(!q||String(x.name).toLowerCase().includes(q))&&(cat==='all'||x.category===cat));$('#wardrobeGrid').innerHTML=owned.length?owned.map(card).join(''):`<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--muted)">Tủ đồ đang trống.</div>`}
function toggleHeart(id){if(wardrobe.includes(id))wardrobe=wardrobe.filter(x=>x!==id);else wardrobe.push(id);localStorage.setItem('theealux_wardrobe',JSON.stringify(wardrobe));renderRank();renderWardrobe();toast(wardrobe.includes(id)?'Đã thêm vào tủ đồ':'Đã bỏ khỏi tủ đồ')}
document.addEventListener('click',e=>{const h=e.target.closest('[data-heart]');if(h)toggleHeart(h.dataset.heart);const sc=e.target.closest('[data-scroll]');if(sc)document.getElementById(sc.dataset.scroll)?.scrollIntoView({behavior:'smooth'});});
$$('#rankTabs button').forEach(b=>b.onclick=()=>{$$('#rankTabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentRank=b.dataset.rank;renderRank()});
$('#wardrobeSearch').oninput=renderWardrobe;$('#categoryFilter').onchange=renderWardrobe;
$('#clearWardrobe').onclick=()=>{wardrobe=[];localStorage.removeItem('theealux_wardrobe');renderRank();renderWardrobe();toast('Đã xóa tủ đồ trên thiết bị')};
function search(){const q=$('#globalSearch').value.trim().toLowerCase();if(!q){$('#ranking').scrollIntoView({behavior:'smooth'});return}const found=items.filter(x=>(String(x.name)+' '+String(x.category)+' '+String(x.suit||'')+' '+(x.tags||[]).join(' ')).toLowerCase().includes(q));$('#rankingGrid').innerHTML=found.slice(0,20).map(card).join('')||'<div style="grid-column:1/-1;padding:30px;color:var(--muted)">Không tìm thấy item.</div>';$('#ranking').scrollIntoView({behavior:'smooth'})}
$('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search()});$('#searchBtn').onclick=search;
$('#themeBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('theealux_dark',document.body.classList.contains('dark'));};if(localStorage.getItem('theealux_dark')==='true')document.body.classList.add('dark');
$('#loginBtn').onclick=()=>$('#loginDialog').showModal();$('#loginSubmit').onclick=()=>{localStorage.setItem('theealux_demo_user',$('#email').value);setTimeout(()=>toast('Đã lưu phiên demo trên thiết bị'),50)};
$('#optimizeBtn').onclick=()=>{const best=[...items].sort((a,b)=>itemScore(b)-itemScore(a)).slice(0,5);$('#optimizerResult').innerHTML=best.length?'<b>Gợi ý từ dữ liệu item</b><br>'+best.map((x,i)=>`${i+1}. ${esc(x.name)} — ${itemScore(x).toLocaleString('vi-VN')} điểm`).join('<br>'):'Chưa có item.'};
$('#menuBtn').onclick=()=>{$('.nav').style.display=$('.nav').style.display==='flex'?'none':'flex';$('.nav').style.position='absolute';$('.nav').style.top='60px';$('.nav').style.left='0';$('.nav').style.right='0';$('.nav').style.padding='16px';$('.nav').style.background='var(--card)';$('.nav').style.flexDirection='column'};
async function boot(){
  try{
    const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error('dataset '+r.status);
    const payload=await r.json();items=Array.isArray(payload.items)?payload.items:[];
    const count=Number(payload.meta?.verifiedCount ?? payload.count ?? items.length);$('#itemCount').textContent=count.toLocaleString('vi-VN');
    const status=$('.hero-mini');if(status&&items.length)status.textContent=`${count.toLocaleString('vi-VN')} item đã đồng bộ từ Annie Nikki Homes`;
  }catch(e){items=[];$('#itemCount').textContent='0';toast('Không tải được dataset');}
  renderRank();renderWardrobe();
}
boot();
