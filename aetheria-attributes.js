(()=>{
'use strict';
const A=['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'];
const L={gorgeous:'Quý phái',simple:'Đơn giản',elegant:'Thanh lịch',lively:'Năng động',mature:'Trưởng thành',cute:'Dễ thương',sexy:'Gợi cảm',pure:'Trong sáng',warm:'Giữ ấm',cool:'Mát mẻ'};
const GRADE=['SS','S','A','B','C','D','E','—'];
let grades={};
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function rows(id){const g=grades[String(id)]?.grades||{};return A.map(k=>({k,label:L[k],grade:g[k]||'—'}));}
function addCard(c){const id=c.dataset.itemId;if(!id||c.querySelector('.real-attr-row'))return;const r=rows(id);if(!grades[id])return;const b=c.querySelector('.item-body');if(!b)return;const el=document.createElement('div');el.className='real-attr-row';el.innerHTML=r.filter(x=>x.grade!=='—').slice(0,3).map(x=>`<span><b>${esc(x.grade)}</b>${esc(x.label)}</span>`).join('');if(el.innerHTML)b.appendChild(el)}
function addDetail(){const d=document.querySelector('#itemDetailContent');if(!d||d.querySelector('.real-attr-panel'))return;const id=(d.querySelector('.detail-badge:nth-child(2)')?.textContent||'').replace(/\D/g,'');if(!id||!grades[id])return;const r=rows(id),el=document.createElement('div');el.className='real-attr-panel';el.innerHTML=`<div class="real-attr-head"><div><small>ĐỐI CHIẾU THUỘC TÍNH</small><h4>Chỉ số hiển thị trong nguồn Việt</h4></div><span>✓</span></div><div class="real-attr-grid">${r.map(x=>`<div><span>${esc(x.label)}</span><b class="g-${esc(x.grade)}">${esc(x.grade)}</b></div>`).join('')}</div><p>Hạng chữ là dữ liệu hiển thị từ trang item công khai; không chuyển thành “điểm game” giả.</p>`;d.querySelector('.detail-main')?.appendChild(el)}
function enhance(){document.querySelectorAll('[data-item-id]').forEach(addCard);addDetail()}
async function boot(){try{const r=await fetch('./data/item-attribute-grades.json?b=20260917attr1',{cache:'no-store'});if(!r.ok){console.info('[Aetheria attributes] scanner chưa có output');return}const d=await r.json();grades=d.items||{};window.__aetheriaAttributeGrades=grades;window.__aetheriaAttributeCoverage=d.coverage||{};enhance();new MutationObserver(enhance).observe(document.body,{subtree:true,childList:true});const hs=document.querySelector('#heroStatus');if(hs&&d.coverage){const n=document.createElement('div');n.className='attribute-coverage';n.textContent=`✦ Thuộc tính đã quét: ${(d.coverage.withAnyAttributes||0).toLocaleString('vi-VN')}/${(d.itemCount||0).toLocaleString('vi-VN')}`;hs.appendChild(n)}}catch(e){console.warn('[Aetheria attributes]',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
