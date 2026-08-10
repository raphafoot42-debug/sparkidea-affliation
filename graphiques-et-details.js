  // Period filters (regenerate bars for visual feedback)
  document.querySelectorAll('.period-filter').forEach(group=>{
    group.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        group.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const chart = document.getElementById(group.dataset.chart);
        chart.querySelectorAll('.bar').forEach(bar=>{
          bar.style.height = (25 + Math.random()*75) + '%';
        });
      });
    });
  });

  // Affiliate detail panel
  const overlay = document.getElementById('detail-overlay');
  let activeRow = null;
  document.querySelectorAll('#affiliate-rows tr').forEach(row=>{
    row.addEventListener('click', ()=>{
      activeRow = row;
      document.getElementById('detail-name').textContent = row.dataset.name;
      document.getElementById('detail-sub').textContent = row.dataset.clients + ' clients actifs ramenés';
      document.getElementById('detail-rate').value = row.dataset.rate;
      document.getElementById('detail-lock').checked = row.dataset.locked === 'true';
      overlay.classList.add('active');
    });
  });
  ['detail-close','detail-close-2'].forEach(id=>{
    document.getElementById(id).addEventListener('click', ()=> overlay.classList.remove('active'));
  });
  overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.classList.remove('active'); });
  document.getElementById('detail-save').addEventListener('click', ()=>{
    if(activeRow){
      const newRate = document.getElementById('detail-rate').value;
      const locked = document.getElementById('detail-lock').checked;
      activeRow.dataset.rate = newRate;
      activeRow.dataset.locked = locked;
      const pill = activeRow.querySelector('.pill');
      let tierClass = 't1';
      if(newRate >= 50) tierClass = 't4';
      else if(newRate >= 30) tierClass = 't3';
      else if(newRate >= 20) tierClass = 't2';
      pill.className = 'pill ' + tierClass;
      pill.textContent = (locked ? '🔒 ' : '') + newRate + '%';
    }
    overlay.classList.remove('active');
  });
