  // Copier un lien (bouton .copy, présent partout - liens principaux et sous-affiliés)
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.copy');
    if(!btn) return;
    const text = btn.dataset.copyTarget || btn.closest('.link-box')?.textContent.replace('Copier','').trim();
    if(!text) return;
    navigator.clipboard?.writeText(text).catch(()=>{});
    const original = btn.textContent;
    btn.textContent = 'Copié !';
    setTimeout(()=>{ btn.textContent = original; }, 1500);
  });

  // Sous-affiliation : création d'un sous-affilié
  const subCreateBtn = document.getElementById('sub-create-btn');
  if(subCreateBtn){
    const myCode = 'TN2847'; // le code de l'affilié connecté
    subCreateBtn.addEventListener('click', ()=>{
      const nameInput = document.getElementById('sub-name-input');
      const codeInput = document.getElementById('sub-code-input');
      const errorBox = document.getElementById('sub-create-error');
      const name = nameInput.value.trim();
      let code = codeInput.value.trim().replace(/["']/g,'').toUpperCase().replace(/\s+/g,'');

      if(!code){
        errorBox.textContent = 'Merci de renseigner un code pour ce sous-affilié.';
        errorBox.style.display = 'block';
        return;
      }
      const existing = Array.from(document.querySelectorAll('#sub-affiliate-rows .link-tag'))
        .some(td => td.textContent.includes('sub='+code));
      if(existing){
        errorBox.textContent = 'Ce code est déjà utilisé par un autre sous-affilié.';
        errorBox.style.display = 'block';
        return;
      }
      errorBox.style.display = 'none';

      const link = `spark-idea.com/?ref=${myCode}&sub=${code}`;
      const row = document.createElement('tr');
      row.dataset.subRow = '';
      row.dataset.active = 'true';
      row.innerHTML = `
        <td>${name || code}</td>
        <td class="link-tag">${link}</td>
        <td><span class="pill t2 active-dot sub-status-pill">Actif</span></td>
        <td>0</td>
        <td>0 €</td>
        <td style="text-align:right;">
          <button class="copy" data-copy-target="${link}">Copier</button>
          <button class="btn-ghost sub-toggle-btn" style="padding:6px 12px; font-size:11px; margin-left:6px;">Désactiver</button>
        </td>`;
      document.getElementById('sub-affiliate-rows').prepend(row);
      nameInput.value = '';
      codeInput.value = '';
    });
  }

  // Sous-affiliation : activer / désactiver un sous-affilié
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.sub-toggle-btn');
    if(!btn) return;
    const row = btn.closest('tr');
    const pill = row.querySelector('.sub-status-pill');
    const isActive = row.dataset.active === 'true';
    if(isActive){
      row.dataset.active = 'false';
      pill.className = 'pill t1 sub-status-pill';
      pill.textContent = 'Inactif';
      btn.textContent = 'Activer';
    } else {
      row.dataset.active = 'true';
      pill.className = 'pill t2 active-dot sub-status-pill';
      pill.textContent = 'Actif';
      btn.textContent = 'Désactiver';
    }
  });
