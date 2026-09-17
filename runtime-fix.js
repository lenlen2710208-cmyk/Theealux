/* Aetheria runtime recovery: fixes the early app.js null-element abort and mobile navigation. */
(function(){
  function ready(){
    const menu=document.querySelector('#menuBtn');
    const nav=document.querySelector('#nav');
    if(menu&&nav&&!menu.dataset.bound){
      menu.dataset.bound='1';
      menu.setAttribute('aria-controls','nav');
      menu.setAttribute('aria-expanded','false');
      const close=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')};
      const toggle=()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open)};
      menu.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});
      nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
      document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&e.target!==menu)close()});
      document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
      window.addEventListener('resize',()=>{if(window.innerWidth>900)close()});
    }
    const login=document.querySelector('#loginBtn');
    const dialog=document.querySelector('#loginDialog');
    if(login&&dialog&&!login.dataset.bound){login.dataset.bound='1';login.addEventListener('click',()=>{if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')})}
    if(typeof window.boot==='function'&&!window.__aetheriaBootRecovered){
      window.__aetheriaBootRecovered=true;
      Promise.resolve().then(()=>window.boot()).catch(err=>{console.error('Aetheria recovery boot failed',err);const h=document.querySelector('#heroStatus');if(h)h.innerHTML='<div>⚠ Có lỗi khi khởi tạo giao diện</div><small>Hãy tải lại trang nếu lỗi vẫn còn.</small>'});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
