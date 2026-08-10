  // Admin messages: switch conversation
  document.querySelectorAll('#ad-msg-list .msg-list-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      document.querySelectorAll('#ad-msg-list .msg-list-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      item.querySelector('.msg-unread')?.remove();
      document.getElementById('ad-msg-head').textContent = item.dataset.name;
    });
  });

  // Admin: create pack modal
  const packOverlay = document.getElementById('pack-overlay');
  document.getElementById('new-pack-btn').addEventListener('click', ()=> packOverlay.classList.add('active'));
  document.getElementById('pack-cancel').addEventListener('click', ()=> packOverlay.classList.remove('active'));
  document.getElementById('pack-close-x').addEventListener('click', ()=> packOverlay.classList.remove('active'));
  packOverlay.addEventListener('click', e=>{ if(e.target===packOverlay) packOverlay.classList.remove('active'); });
  document.getElementById('pack-create').addEventListener('click', ()=>{
    const title = document.getElementById('pack-title-input').value || 'Nouveau pack';
    const reward = document.getElementById('pack-reward-input').value || '0';
    const desc = document.getElementById('pack-desc-input').value || '';
    const card = document.createElement('div');
    card.className = 'pack-card';
    card.innerHTML = `<button class="pack-edit">Modifier</button>
      <div class="pack-reward">+${reward} €</div>
      <div class="pack-title">${title}</div>
      <div class="pack-desc">${desc}</div>
      <div class="pack-meta"><span>Visible par 27 affiliés</span><span>Nouveau</span></div>`;
    document.getElementById('ad-packs-grid').prepend(card);
    packOverlay.classList.remove('active');
    document.getElementById('pack-title-input').value='';
    document.getElementById('pack-reward-input').value='';
    document.getElementById('pack-desc-input').value='';
  });
