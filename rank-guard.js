/* Aetheria ranking integrity layer: never present a proxy attribute sum as real battle score. */
(function(){
  const BUILD='2026.09.17-r77';
  const esc2=v=>String(v??'').replace(/[&<>\\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]||c));
  function chapterOf(s){
    const text=String(s?.label||s?.name||'');
    const m=text.match(/Chương\s*(\d+)/i); if(m)return `Chương ${m[1]}`;
    const id=String(s?.id||''); const v=id.match(/^v\d+-(\d+)-/i); if(v)return `Chương ${v[1]}`;
    const g=id.match(/^(?:guild|aihoi|gh|g)-(\d+)/i); if(g)return `Chương ${g[1]}`;
    return 'Khác';
  }
  function exactItemData(x){return !!x && !!(x.internalParams||x.internal||x.internal_parameters||x.internalScore||x.scoreParams||x.partScores)}
  function exactStageData(s){return !!s && !!s.attrs && !!(s.judgmentCoefficients||s.judgementCoefficients||s.judgment||s.opponent||s.opponentScore||s.opponentSkills||s.skillEffects||s.tagCoefficients)}
  function exactReady(stage){return !!stage && exactStageData(stage) && Array.isArray(items) && items.length>0 && items.some(exactItemData)}
  function removeLegacySelector(){document.querySelector('#rankStageSelect')?.remove()}
  function setBuildStatus(){
    const host=document.querySelector('#heroStatus');
    if(!host)return;
    if(!host.querySelector('.build-status')){
      const el=document.createElement('div');el.className='build-status';el.textContent=`✓ Bản triển khai ${BUILD}`;host.appendChild(el)
    }
  }
  function ensureHierarchy(){
    removeLegacySelector();
    const cat=document.querySelector('#rankCategory'); if(!cat)return;
    let wrap=document.querySelector('#rankStageHierarchy');
    if(!wrap){wrap=document.createElement('div');wrap.id='rankStageHierarchy';wrap.className='rank-stage-hierarchy';cat.insertAdjacentElement('afterend',wrap)}
    const stages=(stageData?.stages||[]).filter(s=>s.group===currentRank);
    const isCompetition=currentRank==='thidau';
    const chapters=[...new Set(stages.map(chapterOf))];
    const oldStage=window.__aetheriaSelectedStage||'';
    wrap.innerHTML='<select id="rankChapterSelect" aria-label="Chọn chương"></select><select id="rankExactStageSelect" aria-label="Chọn ải hoặc chủ đề"></select>';
    const ch=document.querySelector('#rankChapterSelect'),st=document.querySelector('#rankExactStageSelect');
    ch.innerHTML=chapters.length?chapters.map(v=>`<option value="${esc2(v)}">${esc2(isCompetition?'Chủ đề':v)}</option>`).join(''):'<option value="">Chưa có dữ liệu</option>';
    const wanted=stages.find(s=>s.id===oldStage);if(wanted)ch.value=chapterOf(wanted);
    function fill(){
      const list=stages.filter(s=>chapterOf(s)===(ch.value||chapters[0]));
      st.innerHTML=list.length?list.map(s=>`<option value="${esc2(s.id)}">${esc2(s.label||s.name||s.id)}</option>`).join(''):'<option value="">Chưa có ải đã xác minh</option>';
      if(list.some(s=>s.id===oldStage))st.value=oldStage;
      window.__aetheriaSelectedStage=st.value||'';
    }
    fill();
    ch.onchange=()=>{window.__aetheriaSelectedStage='';fill();window.renderRank()};
    st.onchange=()=>{window.__aetheriaSelectedStage=st.value;window.renderRank()};
  }
  window.aetheriaRankingReady=exactReady;
  window.aetheriaStageChapter=chapterOf;
  window.aetheriaExactItem=exactItemData;
  window.aetheriaExactStage=exactStageData;
  window.setupAetheriaRankingHierarchy=ensureHierarchy;
  window.renderRank=function(){
    ensureHierarchy();setBuildStatus();
    const grid=document.querySelector('#rankingGrid'),info=document.querySelector('#rankInfo'),desc=document.querySelector('#rankDescription');
    if(!grid)return;
    const id=window.__aetheriaSelectedStage||document.querySelector('#rankExactStageSelect')?.value;
    const stage=(stageData?.stages||[]).find(s=>s.id===id);
    if(!stage){grid.innerHTML='<div class="empty"><b>Chưa có chặng đã xác minh.</b><br>Aetheria không tự tạo Top khi thiếu dữ liệu chặng.</div>';if(info)info.textContent='Chưa có dữ liệu chặng';return}
    if(!exactReady(stage)){
      grid.innerHTML=`<div class="empty"><b>Chưa mở bảng xếp hạng thật cho ${esc2(stage.label||stage.name||stage.id)}.</b><br>Thiếu dữ liệu điểm nội bộ của item và/hoặc hệ số phán định, điểm đối thủ, kỹ năng và hệ số tag cần để tái hiện cơ chế tính điểm game.<br><strong>Aetheria không dùng phép cộng 10 thuộc tính để giả làm điểm trận đấu.</strong></div>`;
      if(info)info.textContent='Chưa đủ dữ liệu tính điểm thật';
      if(desc)desc.textContent='Khi dữ liệu hoàn chỉnh, người dùng có thể chọn Top 20 / 50 / 100 cho đúng từng ải hoặc chủ đề.';
      return;
    }
    grid.innerHTML='<div class="empty"><b>Đã đủ đầu vào tính điểm thật.</b><br>Bộ máy đang chờ dữ liệu bài toán hoàn chỉnh cho từng vị trí trang phục.</div>';
    if(info)info.textContent='Đã đủ đầu vào — chưa phát hành điểm giả lập';
  };
  window.optimize=function(){
    const out=document.querySelector('#optimizerResult');if(!out)return;
    const id=window.__aetheriaSelectedStage||document.querySelector('#rankExactStageSelect')?.value;
    const stage=(stageData?.stages||[]).find(s=>s.id===id);
    if(!stage){out.textContent='Chọn một chặng cụ thể để kiểm tra dữ liệu.';return}
    if(!exactReady(stage)){out.innerHTML=`<b>${esc2(stage.label||stage.name||stage.id)}</b><br><span>Chưa đủ dữ liệu để tính điểm chiến đấu thật.</span><small>Không dùng chỉ số phù hợp 10 thuộc tính làm điểm trận đấu.</small>`;return}
    out.innerHTML='<b>Đã đủ dữ liệu đầu vào.</b><br>Bộ tối ưu sẽ chỉ chạy khi đủ internal của item, hệ số chặng/tag, hệ số phán định và dữ liệu kỹ năng/đối thủ.';
  };
  function bootGuard(){setBuildStatus();window.renderRank();window.optimize()}
  setTimeout(bootGuard,0);
})();
