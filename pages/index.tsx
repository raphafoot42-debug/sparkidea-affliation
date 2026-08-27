import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <style jsx global>{`
:root {
    --bg: #06080d;
    --bg-soft: #0c1019;
    --card: #10141f;
    --card-hover: #141a28;
    --ink: #f4f6fa;
    --ink-soft: #909aad;
    --ink-dim: #5b6376;
    --line: #1d2433;
    --line-bright: #2a3346;
    --blue: #3d5bf6;
    --blue-bright: #6c8bff;
    --blue-glow: rgba(61, 91, 246, 0.25);
    --green: #2ee88e;
    --green-glow: rgba(46, 232, 142, 0.18);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--ink);
    background: var(--bg);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  .wrap { max-width: 920px; margin: 0 auto; padding: 0 28px; }
  a { color: inherit; }
  ::selection { background: var(--blue); color: #fff; }

  /* ---------- NAV ---------- */
  nav.wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 26px 28px;
    position: sticky;
    top: 0;
    z-index: 20;
    backdrop-filter: blur(14px);
    background: rgba(6, 8, 13, 0.72);
  }
  .brand {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 19px;
    letter-spacing: -0.01em;
  }
  .brand span {
    background: linear-gradient(135deg, var(--blue-bright), var(--green));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .nav-link {
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink-soft);
    border: 1px solid var(--line);
    padding: 9px 20px;
    border-radius: 999px;
    transition: border-color .2s, color .2s, background .2s;
  }
  .nav-link:hover { border-color: var(--blue-bright); color: var(--ink); background: rgba(108,139,255,0.08); }

  /* ---------- HERO ---------- */
  .hero {
    padding: 88px 0 72px;
    text-align: center;
    position: relative;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: -180px;
    left: 50%;
    transform: translateX(-50%);
    width: 900px;
    height: 500px;
    background: radial-gradient(ellipse at center, var(--blue-glow) 0%, transparent 68%);
    pointer-events: none;
    z-index: -1;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    color: var(--blue-bright);
    background: rgba(61,91,246,0.1);
    border: 1px solid rgba(108,139,255,0.25);
    padding: 7px 16px;
    border-radius: 999px;
    margin-bottom: 30px;
    letter-spacing: 0.01em;
  }
  .badge::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 0 4px var(--green-glow);
  }
  h1 {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: clamp(34px, 5.6vw, 56px);
    line-height: 1.08;
    letter-spacing: -0.02em;
    max-width: 16ch;
    margin: 0 auto 22px;
  }
  h1 .grad {
    background: linear-gradient(135deg, var(--blue-bright) 10%, var(--green) 90%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .hero p {
    font-size: 18px;
    color: var(--ink-soft);
    max-width: 48ch;
    margin: 0 auto 38px;
  }

  .hero-ctas {
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    padding: 15px 30px;
    border-radius: 12px;
    transition: transform .18s, box-shadow .18s, background .18s, border-color .18s, color .18s;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--blue), #5570ff);
    color: #fff;
    box-shadow: 0 8px 24px -8px var(--blue-glow), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(61,91,246,0.45), inset 0 1px 0 rgba(255,255,255,0.15); }
  .btn-square {
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--line-bright);
  }
  .btn-square:hover { border-color: var(--blue-bright); color: var(--blue-bright); background: var(--card-hover); transform: translateY(-2px); }

  /* ---------- SECTION ---------- */
  .section { padding: 72px 0; border-top: 1px solid var(--line); }
  .section-eyebrow {
    display: block;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--green);
    margin-bottom: 14px;
  }
  .section-title {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: clamp(24px, 3.4vw, 30px);
    text-align: center;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  .section-sub {
    text-align: center;
    color: var(--ink-soft);
    font-size: 15.5px;
    max-width: 50ch;
    margin: 0 auto 44px;
  }

  /* ---------- RECURRENCE STRIP ---------- */
  .recur-strip {
    display: flex;
    align-items: stretch;
    background: linear-gradient(180deg, var(--card), var(--bg-soft));
    border: 1px solid var(--line-bright);
    border-radius: 18px;
    padding: 8px;
    gap: 4px;
    box-shadow: 0 20px 50px -30px rgba(0,0,0,0.6);
  }
  .recur-item {
    flex: 1;
    text-align: center;
    padding: 24px 12px;
    border-radius: 14px;
    transition: background .2s;
  }
  .recur-item:last-child {
    background: rgba(46,232,142,0.06);
    border: 1px solid rgba(46,232,142,0.2);
  }
  .recur-day {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-dim);
    margin-bottom: 12px;
  }
  .recur-amt {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: clamp(20px, 3vw, 26px);
    color: var(--green);
    letter-spacing: -0.01em;
  }
  .recur-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-dim);
    font-size: 15px;
    width: 24px;
    flex-shrink: 0;
  }

  /* ---------- LES DEUX LIENS ---------- */
  .links-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .link-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 30px;
    transition: border-color .2s, transform .2s, background .2s;
  }
  .link-card:hover { border-color: var(--line-bright); background: var(--card-hover); transform: translateY(-3px); }
  .link-icon {
    width: 42px; height: 42px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
  }
  .link-icon.client { background: rgba(61,91,246,0.14); }
  .link-icon.affilie { background: rgba(46,232,142,0.12); }
  .link-tag {
    display: inline-block;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 5px 11px;
    border-radius: 6px;
    margin-bottom: 14px;
  }
  .link-tag.client { background: rgba(61,91,246,0.14); color: var(--blue-bright); }
  .link-tag.affilie { background: rgba(46,232,142,0.12); color: var(--green); }
  .link-card h3 {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }
  .link-card p { font-size: 14.5px; color: var(--ink-soft); }

  /* ---------- PALIERS ---------- */
  .tier-box {
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
    background: var(--card);
  }
  .tier-row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 2fr;
    gap: 16px;
    align-items: center;
    padding: 22px 26px;
    border-bottom: 1px solid var(--line);
    transition: background .15s;
  }
  .tier-row:hover:not(.head) { background: rgba(255,255,255,0.015); }
  .tier-row:last-child { border-bottom: none; }
  .tier-row.head {
    background: var(--bg-soft);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
    padding: 16px 26px;
  }
  .tier-range { font-weight: 600; font-size: 15px; }
  .tier-rate {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 24px;
    background: linear-gradient(135deg, var(--blue-bright), var(--green));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .tier-note { font-size: 13.5px; color: var(--ink-soft); }

  /* ---------- CONFIANCE ---------- */
  .trust-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .trust-item {
    text-align: center;
    padding: 30px 20px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    transition: border-color .2s, transform .2s;
  }
  .trust-item:hover { border-color: var(--line-bright); transform: translateY(-3px); }
  .trust-icon {
    width: 46px; height: 46px;
    background: linear-gradient(135deg, rgba(61,91,246,0.16), rgba(46,232,142,0.12));
    border: 1px solid var(--line-bright);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
  }
  .trust-item h3 { font-family: 'Sora', sans-serif; font-size: 15.5px; font-weight: 700; margin-bottom: 8px; }
  .trust-item p { font-size: 13.5px; color: var(--ink-soft); }

  /* ---------- FAQ ---------- */
  .faq-item {
    border-bottom: 1px solid var(--line);
    padding: 24px 0;
  }
  .faq-item:first-child { padding-top: 0; }
  .faq-item h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    font-family: 'Sora', sans-serif;
  }
  .faq-item p { font-size: 14.5px; color: var(--ink-soft); }

  /* ---------- CTA FOOTER ---------- */
  .cta-footer {
    text-align: center;
    padding: 88px 28px;
    position: relative;
    border-top: 1px solid var(--line);
    overflow: hidden;
  }
  .cta-footer::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 340px;
    background: radial-gradient(ellipse at center, var(--blue-glow) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .cta-footer > * { position: relative; z-index: 1; }
  .cta-footer h2 {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: clamp(26px, 4vw, 34px);
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  .cta-footer p { color: var(--ink-soft); margin-bottom: 32px; font-size: 15.5px; }

  footer {
    text-align: center;
    padding: 44px 24px;
    border-top: 1px solid var(--line);
  }
  .footer-brand {
    font-size: 13px;
    color: var(--ink-dim);
    margin-bottom: 20px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.02em;
  }
  .telegram-badge {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    background: var(--card);
    border: 1px solid var(--line-bright);
    color: var(--ink);
    font-weight: 600;
    font-size: 14px;
    padding: 11px 22px;
    border-radius: 12px;
    text-decoration: none;
    transition: border-color .2s, transform .2s, background .2s;
  }
  .telegram-badge:hover { border-color: var(--blue-bright); background: var(--card-hover); transform: translateY(-2px); }
  .footer-links {
    margin-top: 18px;
    font-size: 13.5px;
  }
  .footer-links a {
    color: var(--ink-soft);
    text-decoration: none;
    border-bottom: 1px solid var(--line-bright);
    padding-bottom: 2px;
    transition: color .2s, border-color .2s;
  }
  .footer-links a:hover { color: var(--blue-bright); border-color: var(--blue-bright); }

  @media (max-width: 640px) {
    .links-grid { grid-template-columns: 1fr; }
    .trust-grid { grid-template-columns: 1fr; }
    .tier-row { grid-template-columns: 1fr; gap: 4px; text-align: left; padding: 18px 20px; }
    .tier-row.head { display: none; }
    .recur-strip { flex-direction: column; }
    .recur-arrow { display: none; }
  }
  a:focus-visible, button:focus-visible {
    outline: 2px solid var(--blue-bright);
    outline-offset: 3px;
  }
      `}</style>
      <nav className="wrap">
        <div className="brand">Spark <span>Idea</span></div>
        <Link href="/login" className="nav-link">Se connecter</Link>
      </nav>

      <header className="hero wrap">
        <span className="badge">Programme d&apos;affiliation</span>
        <h1>Chaque client, <span className="grad">un gain garanti</span></h1>
        <p>
          Commence avec 15 € de CPA par client validé. Plus tu ramènes de clients de qualité,
          plus ton CPA peut augmenter — sans plafond fixé à l&apos;avance.
        </p>
        <div className="hero-ctas">
          <Link href="/signup" className="btn btn-primary">Devenir affilié</Link>
          <a href="https://spark-idea-two.vercel.app/" target="_blank" rel="noopener noreferrer" className="btn btn-square">
            Essayer Spark Idea
          </a>
        </div>
      </header>

      <section className="section wrap">
        <span className="section-eyebrow">Paiement garanti</span>
        <h2 className="section-title">Un client validé, un gain acquis</h2>
        <p className="section-sub">Ton CPA est versé une seule fois par client, dès sa validation — pas besoin d&apos;attendre, pas de reprise possible ensuite.</p>
        <div className="recur-strip">
          <div className="recur-item"><div className="recur-day">Client 1</div><div className="recur-amt">15 €</div></div>
          <div className="recur-arrow">→</div>
          <div className="recur-item"><div className="recur-day">Client 2</div><div className="recur-amt">30 €</div></div>
          <div className="recur-arrow">→</div>
          <div className="recur-item"><div className="recur-day">Client 3</div><div className="recur-amt">45 €</div></div>
          <div className="recur-arrow">→</div>
          <div className="recur-item"><div className="recur-day">Client 4</div><div className="recur-amt">60 €</div></div>
        </div>
      </section>

      <section className="section wrap">
        <span className="section-eyebrow">Système de liens</span>
        <h2 className="section-title">Deux liens, deux façons de gagner</h2>
        <p className="section-sub">Chaque affilié reçoit deux liens distincts, à utiliser selon la personne en face.</p>
        <div className="links-grid">
          <div className="link-card">
            <span className="link-tag client">Lien client</span>
            <h3>Pour vendre directement</h3>
            <p>Tu le donnes à une personne qui s&apos;abonne. Tu touches ton CPA fixe dès que son compte est validé, une seule fois.</p>
          </div>
          <div className="link-card">
            <span className="link-tag affilie">Lien affilié</span>
            <h3>Pour recruter des sous-affiliés</h3>
            <p>Tu le donnes à quelqu&apos;un qui veut devenir affilié à son tour. Il rejoint ton équipe et vend sous toi.</p>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <span className="section-eyebrow">CPA évolutif</span>
        <h2 className="section-title">Ton CPA augmente avec tes résultats</h2>
        <p className="section-sub">Plus tu apportes de chiffre d&apos;affaires et de clients actifs et de qualité, plus ton CPA peut augmenter — décidé par l&apos;équipe Spark Idea selon tes performances, pas par un palier automatique.</p>
        <div className="tier-box">
          <div className="tier-row head">
            <span>Ton profil</span>
            <span>CPA possible</span>
            <span>Ce que ça veut dire</span>
          </div>
          <div className="tier-row">
            <span className="tier-range">Tout nouvel affilié</span>
            <span className="tier-rate">15 €</span>
            <span className="tier-note">Ton CPA de départ, dès ton premier client, quel que soit le forfait choisi.</span>
          </div>
          <div className="tier-row">
            <span className="tier-range">Bons résultats</span>
            <span className="tier-rate">20 à 50 €</span>
            <span className="tier-note">Clients qui restent actifs, volume régulier — l&apos;équipe peut ajuster ton CPA à la hausse.</span>
          </div>
          <div className="tier-row">
            <span className="tier-range">Très bons partenaires</span>
            <span className="tier-rate">80 à 150 €</span>
            <span className="tier-note">Chiffre d&apos;affaires important généré, clients de qualité qui restent abonnés durablement.</span>
          </div>
          <div className="tier-row">
            <span className="tier-range">Top partenaires</span>
            <span className="tier-rate">150 € et plus</span>
            <span className="tier-note">Pas de plafond fixé à l&apos;avance — négocié individuellement avec l&apos;équipe.</span>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <span className="section-eyebrow">Sécurité</span>
        <h2 className="section-title">Pourquoi c&apos;est fiable</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c8bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <h3>Paiements via Stripe</h3>
            <p>Le suivi des clients et des virements est entièrement automatisé, aucune erreur possible.</p>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ee88e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3>CPA versé immédiatement</h3>
            <p>Dès qu&apos;un client est validé, ton CPA part sur ton compte — pas besoin d&apos;attendre la fin du mois.</p>
          </div>
          <div className="trust-item">
            <div className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c8bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </div>
            <h3>Rien n&apos;est repris</h3>
            <p>Une fois ton CPA versé pour un client, il t&apos;appartient — même si ce client se désabonne ensuite.</p>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <span className="section-eyebrow">Questions</span>
        <h2 className="section-title">Questions fréquentes</h2>
        <div className="faq-item">
          <h3>Est-ce que c&apos;est gratuit de devenir affilié ?</h3>
          <p>Oui, l&apos;inscription est gratuite et sans engagement.</p>
        </div>
        <div className="faq-item">
          <h3>Comment mon CPA change-t-il ?</h3>
          <p>Ce n&apos;est pas automatique : l&apos;équipe Spark Idea l&apos;ajuste manuellement en fonction du nombre de clients que tu apportes, de leur qualité et du chiffre d&apos;affaires généré. Il n&apos;y a pas de palier ni de seuil garanti.</p>
        </div>
        <div className="faq-item">
          <h3>Quelle est la différence entre les deux liens ?</h3>
          <p>Le lien client sert à vendre directement l&apos;abonnement. Le lien affilié sert à recruter d&apos;autres affiliés qui vendront sous toi, avec leur propre CPA.</p>
        </div>
        <div className="faq-item">
          <h3>Est-ce que mon CPA peut baisser ?</h3>
          <p>Un changement de CPA ne s&apos;applique qu&apos;aux futurs clients — les clients déjà validés te gardent le montant qui leur était associé au moment de leur validation, quoi qu&apos;il arrive.</p>
        </div>
        <div className="faq-item">
          <h3>Le CPA dépend-il du forfait choisi par le client ?</h3>
          <p>Non. Que ton client choisisse Starter, Pro ou Élite, tu touches le même CPA fixe — celui qui est actuellement le tien.</p>
        </div>
      </section>

      <div className="cta-footer">
        <h2>Prêt à commencer ?</h2>
        <p>Crée ton compte affilié en moins d&apos;une minute et reçois tes deux liens.</p>
        <Link href="/signup" className="btn btn-primary">Devenir affilié</Link>
      </div>

      <footer>
        <div className="footer-brand">SPARK IDEA — PROGRAMME D&apos;AFFILIATION</div>
        <a href="https://t.me/Raphael42r" target="_blank" rel="noopener noreferrer" className="telegram-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 3.5c.32-.24.62.13.5.5l-3.2 15.13c-.14.65-.6.8-1.13.5l-4.3-3.17-2.07 2c-.23.23-.42.42-.87.42l.31-4.4L18.9 6.1c.38-.34-.08-.5-.58-.17L7.1 12.5l-4.3-1.35c-.93-.29-.95-.93.2-1.38L20.8 3.6c.4-.14.75.1.6.62Z"/></svg>
          Contact Telegram — @Raphael42r
        </a>
        <div className="footer-links">
          <a href="https://spark-idea-two.vercel.app/" target="_blank" rel="noopener noreferrer">Essayer Spark Idea gratuitement →</a>
        </div>
      </footer>
    </>
  )
}
