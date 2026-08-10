// Accès admin direct depuis l'écran d'inscription (évite de passer par le parcours d'inscription complet)
  // ⚠️ Démo front-end uniquement : ce code est visible dans le JS livré au navigateur.
  //    Avant mise en ligne réelle, cette vérification doit se faire côté serveur (route API + session admin),
  //    jamais avec un code en clair côté client.
  const ADMIN_DEMO_CODE = '2909.42';

  const adminLink = document.getElementById('admin-access-link');
  const adminPanel = document.getElementById('admin-access-panel');
  if (adminLink) {
    adminLink.addEventListener('click', e => {
      e.preventDefault();
      adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
    });
  }

  const adminSubmit = document.getElementById('admin-code-submit');
  if (adminSubmit) {
    adminSubmit.addEventListener('click', () => {
      const input = document.getElementById('admin-code-input');
      const error = document.getElementById('admin-code-error');

      if (input.value.trim() !== ADMIN_DEMO_CODE) {
        error.style.display = 'block';
        return;
      }
      error.style.display = 'none';

      // Saute l'inscription et le login : ouvre directement l'espace admin
      document.querySelectorAll('.demo-switch button').forEach(b => b.classList.remove('active'));
      document.querySelector('.demo-switch button[data-space="admin"]').classList.add('active');
      document.querySelector('.app').style.display = 'block';
      document.getElementById('space-auth').style.display = 'none';
      document.getElementById('space-affilie').style.display = 'none';
      document.getElementById('space-admin').style.display = 'block';
      document.getElementById('drawer-affilie').style.display = 'none';
      document.getElementById('drawer-admin').style.display = 'block';
      document.getElementById('page-title-inline').textContent = "Vue d'ensemble";
      document.querySelector('.avatar').textContent = 'AD';
      document.querySelector('.profile-btn .name').textContent = 'Admin';

      input.value = '';
      adminPanel.style.display = 'none';
    });
  }
