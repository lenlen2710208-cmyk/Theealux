(()=>{
'use strict';
const MAP_URL='./data/vietnamese-names.json?b=20260917r2';
let names={};
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function apply(){
  if(!Object.keys(names).length)return;
  document.querySelectorAll('[data-item-id]').forEach(card=>{const id=String(card.getAttribute('data-item-id')||''),n=names[id];if(!n)return;const el=card.querySelector('.rank-name');if(el&&el.textContent!==n){el.textContent=n;el.title='Tên tiếng Việt đã đối chiếu';}});
  const detail=document.querySelector('.detail-title');
  if(detail){const id=(detail.parentElement?.querySelector('.detail-badge:nth-child(2)')?.textContent||'').replace(/\D/g,'');if(id&&names[id]){detail.textContent=names[id];detail.title='Tên tiếng Việt đã đối chiếu';}}
}
function loadEnhancements(){if(document.querySelector('link[data-aetheria-game-fields]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./aetheria-game-fields.css?v=20260917r94';l.dataset.aetheriaGameFields='1';document.head.appendChild(l);const s=document.createElement('script');s.src='./aetheria-game-fields.js?v=20260917r94';s.defer=true;document.body.appendChild(s)}
async function boot(){try{const r=await fetch(MAP_URL,{cache:'no-store'});if(!r.ok)return;const d=await r.json();names=d.names||{};window.__aetheriaVietnameseNames=names;const status=document.querySelector('#heroStatus');if(status&&Object.keys(names).length){const note=document.createElement('div');note.className='name-source-note';note.innerHTML=`🇻🇳 ${Object.keys(names).length.toLocaleString('vi-VN')} tên Việt đã đối chiếu`;status.appendChild(note)}apply();loadEnhancements();new MutationObserver(apply).observe(document.body,{subtree:true,childList:true})}catch(e){console.warn('[Aetheria names]',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
