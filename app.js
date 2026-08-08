const pageTitles = {
    dashboard:'Tableau de bord', liens:'Mes liens', filleuls:'Mes filleuls', packs:'Packs à gagner', messages:'Messages', parametres:'Paramètres',
    'ad-overview':"Vue d'ensemble", 'ad-affilies':'Affiliés', 'ad-packs':'Packs', 'ad-messages':'Messages'
  };

  // Drawer open/close
  const drawer = document.getElementById('drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  function openDrawer(){ drawer.classList.add('active'); drawerOverlay.classList.add('active'); }
  function closeDrawer(){ drawer.classList.remove('active'); drawerOverlay.classList.remove('active'); }
  document.getElementById('menu-btn').addEventListener('click', openDrawer);
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // Profile dropdown
  const profileMenu = document.getElementById('profile-menu');
  document.getElementById('profile-btn').addEventListener('click', e=>{
    e.stopPropagation(); profileMenu.classList.toggle('active');
  });
  document.addEventListener('click', ()=> profileMenu.classList.remove('active'));

  // Navigation (works for both spaces + profile menu links)
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      const target = el.dataset.nav;
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      const page = document.getElementById('page-'+target);
      if(page) page.classList.add('active');
      document.querySelectorAll('.drawer-item').forEach(d=>d.classList.remove('active'));
      document.querySelectorAll('.drawer-item[data-nav="'+target+'"]').forEach(d=>d.classList.add('active'));
      document.getElementById('page-title-inline').textContent = pageTitles[target] || '';
      closeDrawer();
    });
  });

  // Demo space switcher
  document.querySelectorAll('.demo-switch button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.demo-switch button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const space = btn.dataset.space;
      const app = document.querySelector('.app');
      const authScreen = document.getElementById('space-auth');

      if(space === 'auth'){
        app.style.display = 'none';
        authScreen.style.display = 'flex';
        ['auth-step-1','auth-step-2','auth-step-3'].forEach((id,i)=>{
          document.getElementById(id).style.display = i===0 ? 'block' : 'none';
        });
        return;
      }
      app.style.display = 'block';
      authScreen.style.display = 'none';

      const isAffilie = space === 'affilie';
      document.getElementById('space-affilie').style.display = isAffilie ? 'block' : 'none';
      document.getElementById('space-admin').style.display = isAffilie ? 'none' : 'block';
      document.getElementById('drawer-affilie').style.display = isAffilie ? 'block' : 'none';
      document.getElementById('drawer-admin').style.display = isAffilie ? 'none' : 'block';
      document.getElementById('page-title-inline').textContent = isAffilie ? 'Tableau de bord' : "Vue d'ensemble";
      document.querySelector('.avatar').textContent = isAffilie ? 'TN' : 'AD';
      document.querySelector('.profile-btn .name').textContent = isAffilie ? 'Thomas N.' : 'Admin';
    });
  });

  // Auth flow navigation
  document.querySelectorAll('#space-auth [data-goto]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      document.querySelectorAll('.auth-card').forEach(c=>c.style.display='none');
      document.getElementById(el.dataset.goto).style.display = 'block';
    });
  });
  document.getElementById('auth-finish').addEventListener('click', ()=>{
    document.querySelectorAll('.demo-switch button').forEach(b=>b.classList.remove('active'));
    document.querySelector('.demo-switch button[data-space="affilie"]').classList.add('active');
    document.querySelector('.app').style.display = 'block';
    document.getElementById('space-auth').style.display = 'none';
    document.getElementById('space-affilie').style.display = 'block';
    document.getElementById('space-admin').style.display = 'none';
    document.getElementById('drawer-affilie').style.display = 'block';
    document.getElementById('drawer-admin').style.display = 'none';
  });

  document.getElementById('logout-btn').addEventListener('click', ()=>{
    document.querySelectorAll('.demo-switch button').forEach(b=>b.classList.remove('active'));
    document.querySelector('.demo-switch button[data-space="auth"]').classList.add('active');
    document.querySelector('.app').style.display = 'none';
    document.getElementById('space-auth').style.display = 'flex';
    ['auth-step-1','auth-step-2','auth-step-3'].forEach((id,i)=>{
      document.getElementById(id).style.display = i===0 ? 'block' : 'none';
    });
  });

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

  // Palier celebration (demo trigger)
  const celebrateOverlay = document.getElementById('celebrate-overlay');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const cctx = confettiCanvas.getContext('2d');
  let confettiPieces = [];
  function launchConfetti(){
    confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight;
    confettiCanvas.classList.add('active');
    const colors = ['#00e0ff','#38bdf8','#fbbf24','#c084fc','#4ade80'];
    confettiPieces = Array.from({length:140}, ()=>({
      x: Math.random()*confettiCanvas.width, y: -20 - Math.random()*200,
      s: 4+Math.random()*5, c: colors[Math.floor(Math.random()*colors.length)],
      vy: 2+Math.random()*3, vx: -1.5+Math.random()*3, r: Math.random()*360, vr: -6+Math.random()*12
    }));
    let frame=0;
    function tick(){
      frame++;
      cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      confettiPieces.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.r+=p.vr;
        cctx.save(); cctx.translate(p.x,p.y); cctx.rotate(p.r*Math.PI/180);
        cctx.fillStyle=p.c; cctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6); cctx.restore();
      });
      if(frame<160) requestAnimationFrame(tick);
      else confettiCanvas.classList.remove('active');
    }
    tick();
  }
  document.getElementById('demo-trigger').addEventListener('click', ()=>{
    celebrateOverlay.classList.add('active');
    launchConfetti();
  });
  document.getElementById('celebrate-close').addEventListener('click', ()=> celebrateOverlay.classList.remove('active'));
  celebrateOverlay.addEventListener('click', e=>{ if(e.target===celebrateOverlay) celebrateOverlay.classList.remove('active'); });

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


  // Subtle static-ish cybernetic grid background
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  let w,h, points=[];
  function resize(){
    w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight;
    points = [];
    const gap = 70;
    for(let x=0;x<w+gap;x+=gap){
      for(let y=0;y<h+gap;y+=gap){
        points.push({x:x+(Math.random()*20-10), y:y+(Math.random()*20-10), o:Math.random()*.5+.1});
      }
    }
  }
  let mouse={x:-9999,y:-9999};
  window.addEventListener('mousemove', e=>{mouse.x=e.clientX; mouse.y=e.clientY;});
  window.addEventListener('resize', resize);
  resize();
  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(0,224,255,0.06)';
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        const p1=points[i], p2=points[j];
        const d=Math.hypot(p1.x-p2.x,p1.y-p2.y);
        if(d<90){ ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
      }
    }
    points.forEach(p=>{
      const dm = Math.hypot(p.x-mouse.x,p.y-mouse.y);
      const glow = dm<140 ? (1-dm/140) : 0;
      ctx.beginPath();
      ctx.arc(p.x,p.y,glow>0?2+glow*2:1.4,0,Math.PI*2);
      ctx.fillStyle = glow>0 ? `rgba(0,224,255,${0.15+glow*0.6})` : `rgba(0,224,255,${p.o*0.25})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
