const pageTitles = {
    dashboard:'Tableau de bord', liens:'Mes liens', filleuls:'Mes filleuls', 'sous-affiliation':'Sous-affiliation', packs:'Packs à gagner', messages:'Messages', parametres:'Paramètres',
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

