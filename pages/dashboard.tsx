import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase-client'

const pageTitles: Record<string, string> = {
  dashboard: 'Tableau de bord',
  liens: 'Mes liens',
  filleuls: 'Mes filleuls',
  'sous-affiliation': 'Sous-affiliation',
  guide: 'Guide de vente',
  packs: 'Packs à gagner',
  messages: 'Messages',
  parametres: 'Paramètres',
}

type Affiliate = {
  id: string
  email: string
  referral_code: string
  cpa_amount_cents: number
  active_clients_count: number
  stripe_connected: boolean
  parent_affiliate_id: string | null
}
type Referral = {
  id: string
  customer_email: string
  plan: string
  status: string
  cpa_applied_cents: number
  referred_via_code: string
  created_at: string
}
type Payout = { amount_cents: number; period: string }
type Pack = {
  id: string
  title: string
  description: string
  reward_cents: number
  target_count: number | null
  ends_at: string | null
}
type Message = { id: string; sender: string; body: string; created_at: string }
type SubAffiliate = {
  id: string
  code: string
  name: string | null
  active: boolean
  clients_count: number
  revenue_generated_cents: number
  linked_affiliate_id: string | null
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 1)}****@${domain}`
}
function euros(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
function initialsOf(email: string) {
  return email.slice(0, 2).toUpperCase()
}

// Empêche Next.js de pré-générer cette page en statique au moment du build :
// elle dépend entièrement de la session de l'utilisateur connecté.
export async function getServerSideProps() {
  return { props: {} }
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [subAffiliates, setSubAffiliates] = useState<SubAffiliate[]>([])

  const [newSubName, setNewSubName] = useState('')
  const [newSubCode, setNewSubCode] = useState('')
  const [subError, setSubError] = useState<string | null>(null)
  const [messageDraft, setMessageDraft] = useState('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('sparkidea-theme') as 'dark' | 'light') || 'dark'
    setThemeState(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function setTheme(next: 'dark' | 'light') {
    setThemeState(next)
    localStorage.setItem('sparkidea-theme', next)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/signup')
        return
      }

      const [
        { data: aff },
        { data: refs },
        { data: pay },
        { data: pks },
        { data: msgs },
        { data: subs },
      ] = await Promise.all([
        supabase.from('affiliates').select('*').eq('id', user.id).single(),
        supabase.from('referrals').select('*').eq('affiliate_id', user.id).order('created_at', { ascending: false }),
        supabase.from('commission_payouts').select('amount_cents, period').eq('affiliate_id', user.id),
        supabase.from('packs').select('*').eq('active', true),
        supabase.from('messages').select('*').eq('affiliate_id', user.id).order('created_at', { ascending: true }),
        supabase.from('sub_affiliates').select('*').eq('affiliate_id', user.id).order('created_at', { ascending: false }),
      ])

      setAffiliate(aff ?? null)
      setReferrals(refs ?? [])
      setPayouts(pay ?? [])
      setPacks(pks ?? [])
      setMessages(msgs ?? [])
      setSubAffiliates(subs ?? [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function handleCreateSubAffiliate() {
    setSubError(null)
    const code = newSubCode.trim().replace(/["']/g, '').toUpperCase().replace(/\s+/g, '')
    if (!code) {
      setSubError('Merci de renseigner un code pour ce sous-affilié.')
      return
    }
    if (subAffiliates.some((s) => s.code === code)) {
      setSubError('Ce code est déjà utilisé par un autre sous-affilié.')
      return
    }
    const { data, error } = await supabase
      .from('sub_affiliates')
      .insert({ affiliate_id: affiliate!.id, code, name: newSubName.trim() || null })
      .select()
      .single()

    if (error) {
      setSubError(error.message)
      return
    }
    setSubAffiliates((prev) => [data, ...prev])
    setNewSubName('')
    setNewSubCode('')
  }

  async function toggleSubAffiliate(sub: SubAffiliate) {
    const { error } = await supabase
      .from('sub_affiliates')
      .update({ active: !sub.active })
      .eq('id', sub.id)
    if (!error) {
      setSubAffiliates((prev) => prev.map((s) => (s.id === sub.id ? { ...s, active: !s.active } : s)))
    }
  }

  function copyLink(link: string) {
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopiedLink(link)
    setTimeout(() => setCopiedLink(null), 1500)
  }

  async function sendMessage() {
    if (!messageDraft.trim() || !affiliate) return
    const { data, error } = await supabase
      .from('messages')
      .insert({ affiliate_id: affiliate.id, sender: 'affiliate', body: messageDraft.trim() })
      .select()
      .single()
    if (!error) {
      setMessages((prev) => [...prev, data])
      setMessageDraft('')
    }
  }

  if (loading || !affiliate) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          Chargement...
        </div>
      </div>
    )
  }

  const stripeStatus = router.query.stripe_connected
    ? 'connected'
    : router.query.stripe_incomplete
    ? 'incomplete'
    : router.query.stripe_error
    ? 'error'
    : null

  const link = `spark-idea.com/?ref=${affiliate.referral_code}`
  const totalRevenue = payouts.reduce((sum, p) => sum + p.amount_cents, 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthRevenue = payouts.filter((p) => p.period === thisMonth).reduce((sum, p) => sum + p.amount_cents, 0)
  const activeReferrals = referrals.filter((r) => r.status === 'active')

  function nav(tab: string) {
    setActiveTab(tab)
    setDrawerOpen(false)
    setProfileMenuOpen(false)
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-left">
          <div className="menu-btn" onClick={() => setDrawerOpen(true)}>
            <span></span><span></span><span></span>
          </div>
          <div className="brand">Spark <em>Idea</em></div>
          <div className="page-title-inline">{pageTitles[activeTab]}</div>
        </div>
        <div className="profile-wrap">
          <div className="profile-btn" onClick={() => setProfileMenuOpen((o) => !o)}>
            <div className="avatar">{initialsOf(affiliate.email)}</div>
            <span className="name">{affiliate.email.split('@')[0]}</span>
            <span className="chev">▾</span>
          </div>
          {profileMenuOpen && (
            <div className="profile-menu active">
              <a href="#" onClick={(e) => { e.preventDefault(); nav('parametres') }}>Paramètres</a>
              <hr />
              <a href="#" className="danger" onClick={(e) => { e.preventDefault(); handleLogout() }}>Déconnexion</a>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && <div className="drawer-overlay active" onClick={() => setDrawerOpen(false)} />}
      <div className={`drawer${drawerOpen ? ' active' : ''}`}>
        <div className="drawer-head">
          <div className="brand" style={{ fontSize: 15 }}>Menu</div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <div className="drawer-eyebrow">Espace affilié</div>
        {[
          ['dashboard', '◆', 'Tableau de bord'],
          ['liens', '🔗', 'Mes liens'],
          ['filleuls', '☰', 'Mes filleuls'],
          ['sous-affiliation', '🌱', 'Sous-affiliation'],
          ['guide', '📖', 'Guide de vente'],
          ['packs', '🎁', 'Packs à gagner'],
          ['messages', '✉', 'Messages'],
          ['parametres', '⚙', 'Paramètres'],
        ].map(([key, icon, label]) => (
          <div
            key={key}
            className={`drawer-item${activeTab === key ? ' active' : ''}`}
            onClick={() => nav(key)}
          >
            <span className="ic">{icon}</span> {label}
          </div>
        ))}
      </div>

      <main>
        {activeTab === 'dashboard' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Bonjour {affiliate.email.split('@')[0]} 👋</h1>
            <div className="sub">Voici ton CPA actuel et ce que tu as déjà généré.</div>

            {stripeStatus === 'connected' && (
              <div className="card" style={{ marginBottom: 20, borderColor: '#4ade80', color: '#4ade80', fontSize: 13 }}>
                ✅ Compte Stripe connecté — tes commissions seront versées automatiquement.
              </div>
            )}
            {stripeStatus === 'incomplete' && (
              <div className="card" style={{ marginBottom: 20, borderColor: '#fbbf24', color: '#fbbf24', fontSize: 13 }}>
                ⚠️ Connexion Stripe pas encore terminée. Va dans Paramètres pour la finir.
              </div>
            )}
            {stripeStatus === 'error' && (
              <div className="card" style={{ marginBottom: 20, borderColor: '#f87171', color: '#f87171', fontSize: 13 }}>
                ❌ Erreur pendant la connexion Stripe. Réessaie depuis Paramètres.
              </div>
            )}

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Ton CPA actuel</h3></div>
              <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--cyan)', fontFamily: "'JetBrains Mono',monospace" }}>
                {euros(affiliate.cpa_amount_cents)}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
                Tu reçois ce montant fixe pour chaque nouveau client validé que tu apportes, une seule fois par
                client. Ton CPA peut évoluer selon tes performances et la qualité des clients apportés — l&apos;équipe
                Spark Idea l&apos;ajuste manuellement, pas de palier automatique.
              </div>
            </div>

            <div className="stats">
              <div className="stat c-cyan"><div className="label">Clients actifs</div><div className="value">{affiliate.active_clients_count}</div></div>
              <div className="stat c-violet"><div className="label">CPA actuel</div><div className="value accent">{euros(affiliate.cpa_amount_cents)}</div></div>
              <div className="stat c-or"><div className="label">Revenu ce mois</div><div className="value">{euros(monthRevenue)}</div></div>
              <div className="stat c-vert"><div className="label">Revenu total cumulé</div><div className="value">{euros(totalRevenue)}</div></div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Ton lien</h3>
              <div className="link-box">
                {link}
                <button className="copy" onClick={() => copyLink(link)}>{copiedLink === link ? 'Copié !' : 'Copier'}</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'liens' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Mes liens</h1>
            <div className="sub">Ton lien de parrainage et ce qu&apos;il a rapporté.</div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Lien principal</h3>
              <div className="link-box">
                {link}
                <button className="copy" onClick={() => copyLink(link)}>{copiedLink === link ? 'Copié !' : 'Copier'}</button>
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                {affiliate.stripe_connected
                  ? `Stripe connecté — ton CPA de ${euros(affiliate.cpa_amount_cents)} est versé automatiquement dès qu'un client que tu ramènes est validé.`
                  : 'Connecte ton compte Stripe dans Paramètres pour pouvoir être payé.'}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Performance du lien</h3>
              <table>
                <thead><tr><th>Filleuls (total)</th><th>Actifs</th><th>Revenu généré</th></tr></thead>
                <tbody>
                  <tr>
                    <td>{referrals.length}</td>
                    <td>{activeReferrals.length}</td>
                    <td>{euros(totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'filleuls' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Mes filleuls</h1>
            <div className="sub">Tous les clients ramenés via ton lien.</div>

            <div className="card">
              {referrals.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Aucun filleul pour l&apos;instant — partage ton lien pour commencer.
                </div>
              ) : (
                <table>
                  <thead><tr><th>Client</th><th>Forfait</th><th>Lien utilisé</th><th>Depuis</th><th>Statut</th><th>CPA reçu</th></tr></thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td>{maskEmail(r.customer_email)}</td>
                        <td>{r.plan} €</td>
                        <td className="link-tag">?ref={r.referred_via_code}</td>
                        <td>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                        <td><span className={`pill ${r.status === 'active' ? 't2 active-dot' : 't1'}`}>{r.status === 'active' ? 'Actif' : 'Résilié'}</span></td>
                        <td>{euros(r.cpa_applied_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === 'sous-affiliation' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Sous-affiliation</h1>
            <div className="sub">Crée des sous-affiliés qui recrutent des clients pour toi.</div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Comment ça marche</h3></div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
                {affiliate.parent_affiliate_id ? (
                  <>
                    Tu crées un sous-affilié avec un code. Il obtient un lien pour ses clients, comptés sous ton
                    compte. C&apos;est <b>toi</b> qui gères et verses sa part, comme tu le souhaites — Spark Idea ne
                    s&apos;occupe que de ta commission à toi. (Comme tu es toi-même un sous-affilié activé, tes
                    propres sous-affiliés ne peuvent pas être payés automatiquement par Spark Idea — c&apos;est
                    plafonné à 2 niveaux.)
                  </>
                ) : (
                  <>
                    Tu crées un sous-affilié avec un code. Il a deux liens : un lien client (ses ventes, comptées
                    sous toi) et un lien d&apos;invitation pour créer son propre compte. S&apos;il crée son compte et
                    connecte son Stripe, il est payé <b>automatiquement</b> par Spark Idea, avec son propre CPA fixe
                    par client validé (15€ pour commencer, ajustable ensuite par l&apos;équipe selon ses
                    performances — indépendant du tien). Tant qu&apos;il ne l&apos;a pas fait, c&apos;est à toi de le
                    payer toi-même. Une fois activé, il peut lui aussi créer des sous-affiliés — mais ceux-là
                    restent toujours payés à la main par lui, jamais par Spark Idea.
                  </>
                )}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Créer un sous-affilié</h3></div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nom (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex : Nathan"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Code du sous-affilié</label>
                  <input
                    type="text"
                    placeholder='Ex : "NATHAN23"'
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono',monospace" }}
                  />
                </div>
                <button className="btn-primary" onClick={handleCreateSubAffiliate}>+ Créer le lien</button>
              </div>
              {subError && <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 10 }}>{subError}</div>}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Mes sous-affiliés</h3>
              {subAffiliates.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun sous-affilié pour l&apos;instant.</div>
              ) : (
                <table>
                  <thead><tr><th>Sous-affilié</th>{!affiliate.parent_affiliate_id && <th>Compte</th>}<th>Statut</th><th>Clients apportés</th><th>Revenu total généré</th><th></th></tr></thead>
                  <tbody>
                    {subAffiliates.map((s) => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      const clientLink = `spark-idea.com/?ref=${affiliate.referral_code}&sub=${s.code}`
                      const inviteLink = `${origin}/signup?invite=${affiliate.referral_code}&subcode=${s.code}`
                      const canInvite = !affiliate.parent_affiliate_id
                      return (
                        <tr key={s.id}>
                          <td>{s.name || s.code}</td>
                          {canInvite && (
                            <td>
                              {s.linked_affiliate_id ? (
                                <span style={{ color: '#4ade80', fontSize: 12 }}>✅ Activé (payé auto)</span>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: 12 }}>En attente</span>
                              )}
                            </td>
                          )}
                          <td><span className={`pill ${s.active ? 't2 active-dot' : 't1'}`}>{s.active ? 'Actif' : 'Inactif'}</span></td>
                          <td>{s.clients_count}</td>
                          <td>{euros(s.revenue_generated_cents)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="copy" onClick={() => copyLink(clientLink)} title="Lien client">
                              {copiedLink === clientLink ? 'Copié !' : 'Lien client'}
                            </button>
                            {canInvite && !s.linked_affiliate_id && (
                              <button className="copy" style={{ marginLeft: 6 }} onClick={() => copyLink(inviteLink)} title="Lien d'invitation">
                                {copiedLink === inviteLink ? 'Copié !' : 'Lien invitation'}
                              </button>
                            )}
                            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, marginLeft: 6 }} onClick={() => toggleSubAffiliate(s)}>
                              {s.active ? 'Désactiver' : 'Activer'}
                            </button>
                          </td>

                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
                &quot;Revenu total généré&quot; est indicatif tant que le sous-affilié n&apos;a pas activé son compte. Une fois activé, il est payé automatiquement par Spark Idea, en plus de ta commission à toi.
              </div>
            </div>
          </section>
        )}

        {activeTab === 'guide' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Comment vendre Spark Idea</h1>
            <div className="sub">Tout ce qu&apos;il te faut pour expliquer le produit et convaincre en 30 secondes.</div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>En une phrase</h3></div>
              <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7, fontWeight: 500 }}>
                Spark Idea transforme une idée de projet floue en plan d&apos;action concret, généré par IA,
                en quelques minutes.
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Le problème que ça résout</h3></div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
                Plein de gens ont une idée de business, d&apos;appli ou de projet en tête — mais restent
                bloqués à &quot;je ne sais pas par où commencer&quot;. Pas le temps, pas la méthode, pas les
                compétences pour structurer ça en plan clair. Résultat : l&apos;idée reste une idée, jamais
                lancée. C&apos;est exactement ce blocage que Spark Idea débloque.
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Comment ça marche (à montrer en démo)</h3></div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li style={{ marginBottom: 8 }}><b style={{ color: 'var(--text)' }}>Il décrit son idée</b> — en quelques phrases, gratuitement, sans compte à créer.</li>
                  <li style={{ marginBottom: 8 }}><b style={{ color: 'var(--text)' }}>L&apos;IA lui pose des questions ciblées</b> — cible, budget, contraintes, objectif.</li>
                  <li style={{ marginBottom: 8 }}><b style={{ color: 'var(--text)' }}>Il reçoit son plan</b> — un schéma complet et personnalisé, avec étapes et priorités.</li>
                  <li><b style={{ color: 'var(--text)' }}>Il passe à l&apos;action</b> — il suit ses &quot;quêtes&quot; (marketing/technique) et voit sa progression, avec un rappel quotidien par email pour rester actif.</li>
                </ol>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Les forfaits</h3></div>
              <table>
                <thead><tr><th>Forfait</th><th>Prix/mois</th><th>Pour qui</th></tr></thead>
                <tbody>
                  <tr><td>Starter</td><td>19 €</td><td>Une idée à la fois, l&apos;essentiel pour démarrer</td></tr>
                  <tr><td>Pro</td><td>24 €</td><td>Jusqu&apos;à 5 idées actives, export PDF, plus de messages IA</td></tr>
                  <tr><td>Élite</td><td>97 €</td><td>Jusqu&apos;à 15 idées, suivi complet dans le temps, tout inclus</td></tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Pourquoi c&apos;est facile à vendre</h3></div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li style={{ marginBottom: 8 }}><b style={{ color: 'var(--text)' }}>Le besoin est universel</b> — tout le monde a &quot;une idée qu&apos;il n&apos;a jamais lancée&quot;. Cible large : entrepreneurs, freelances, créateurs de contenu, étudiants.</li>
                  <li style={{ marginBottom: 8 }}><b style={{ color: 'var(--text)' }}>La démo est gratuite et immédiate</b> — pas besoin de convaincre longtemps, la personne teste en 2 minutes, sans carte bancaire.</li>
                  <li style={{ marginBottom: 8 }}><b style={{ color: 'var(--text)' }}>Le résultat est concret et impressionnant</b> — un plan structuré généré en quelques instants, ça se montre facilement (capture d&apos;écran, vidéo courte).</li>
                  <li><b style={{ color: 'var(--text)' }}>Le prix reste accessible</b> face à la valeur perçue — un plan personnalisé, normalement issu d&apos;un consultant ou de plusieurs heures de recherche.</li>
                </ul>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head"><h3>Comment toi, tu gagnes de l&apos;argent avec ça</h3></div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
                Chaque nouveau client que tu apportes te rapporte un <b style={{ color: 'var(--text)' }}>montant fixe, versé
                une seule fois</b> dès que ce client est validé — quel que soit le forfait qu&apos;il choisit
                (Starter, Pro ou Élite, ça ne change rien à ton gain).
                <br /><br />
                Tu commences avec un <b style={{ color: 'var(--text)' }}>CPA de 15€ par client</b>. Ce montant n&apos;est
                pas figé : plus tu apportes de clients de qualité qui restent actifs, plus l&apos;équipe Spark Idea
                peut l&apos;augmenter manuellement — il n&apos;y a pas de plafond fixé à l&apos;avance. Certains
                affiliés passent à 20€, 30€, 50€, 80€, 100€ ou plus selon leurs résultats.
                <br /><br />
                Concrètement : si tu ramènes 20 clients avec un CPA à 15€, tu touches <b style={{ color: 'var(--text)' }}>300€</b>,
                versés au fur et à mesure que chaque client est validé — pas d&apos;un coup, mais garantis, sans
                dépendre de la durée pendant laquelle ce client reste abonné.
                <br /><br />
                Important à savoir : si ton CPA change (par exemple de 15€ à 30€), ça ne s&apos;applique qu&apos;aux
                <b style={{ color: 'var(--text)' }}> nouveaux</b> clients que tu apportes ensuite. Les clients déjà
                validés avant le changement gardent le montant qui leur était associé au moment de leur validation.
                <br /><br />
                Tu as aussi <b style={{ color: 'var(--text)' }}>deux liens différents</b> : un lien client (pour vendre
                directement) et un lien pour recruter d&apos;autres sous-affiliés, qui vendent sous toi avec leur
                propre CPA. Plus ton équipe grandit, plus ton volume de clients apportés grandit avec elle — sans que
                tu aies à vendre toi-même à chaque fois.
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>L&apos;argument à recopier tel quel</h3></div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid var(--cyan)', paddingLeft: 14 }}>
                &quot;Tu as une idée de projet mais tu ne sais pas par où commencer ? Décris-la à Spark Idea,
                réponds à quelques questions, et reçois un plan d&apos;action complet en quelques minutes —
                gratuit pour essayer, sans carte bancaire.&quot;
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 14 }}>
                Astuce : ce message marche bien tel quel en story Instagram, en DM, ou en légende de vidéo —
                pas besoin de le réécrire à chaque fois.
              </div>
            </div>
          </section>
        )}

        {activeTab === 'packs' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Packs à gagner</h1>
            <div className="sub">Défis bonus mis en place par l&apos;équipe Spark Idea.</div>

            {packs.length === 0 ? (
              <div className="card" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun pack actif pour l&apos;instant.</div>
            ) : (
              <div className="packs-grid">
                {packs.map((p, i) => (
                  <div className={`pack-card ${i % 2 === 0 ? 'p-violet' : 'p-vert'}`} key={p.id}>
                    <div className="pack-reward">+{euros(p.reward_cents)}</div>
                    <div className="pack-title">{p.title}</div>
                    <div className="pack-desc">{p.description}</div>
                    <div className="pack-meta">
                      <span>{p.target_count ? `Objectif : ${p.target_count} clients` : 'Sans objectif chiffré'}</span>
                      <span>{p.ends_at ? `Se termine le ${new Date(p.ends_at).toLocaleDateString('fr-FR')}` : 'Sans date de fin'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'messages' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Messages</h1>
            <div className="sub">Écris directement à l&apos;équipe Spark Idea.</div>

            <div className="msg-thread" style={{ height: 480 }}>
              <div className="msg-thread-head">Équipe Spark Idea</div>
              <div className="msg-scroll">
                {messages.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', padding: 12 }}>Aucun message pour l&apos;instant.</div>
                ) : (
                  messages.map((m) => (
                    <div className={`bubble ${m.sender === 'affiliate' ? 'out' : 'in'}`} key={m.id}>
                      {m.body}
                      <div className="bubble-time">{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="msg-input-row">
                <input
                  type="text"
                  placeholder="Écrire un message..."
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn-primary" onClick={sendMessage}>Envoyer</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'parametres' && (
          <section className="page active">
            <div className="eyebrow">Programme d&apos;affiliation</div>
            <h1>Paramètres</h1>
            <div className="sub">Ton compte, ton Stripe, tes infos.</div>

            <div className="settings-block">
              <div className="settings-row" style={{ borderTop: 'none', paddingTop: 4 }}>
                <div><div className="label">Compte Stripe</div><div className="desc">Reçoit tes commissions automatiquement</div></div>
                {affiliate.stripe_connected ? (
                  <span className="status-connected">✅ Connecté</span>
                ) : (
                  <a className="btn-primary" href="/api/stripe-connect" style={{ textDecoration: 'none' }}>Connecter</a>
                )}
              </div>
              <div className="settings-row">
                <div><div className="label">Ton CPA actuel</div><div className="desc">Montant reçu par client validé — ajusté manuellement par l&apos;équipe Spark Idea</div></div>
                <span className="static" style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--cyan)' }}>{euros(affiliate.cpa_amount_cents)}</span>
              </div>
              <div className="settings-row">
                <div><div className="label">Ton lien</div><div className="desc">{link}</div></div>
                <button className="btn-ghost" onClick={() => nav('liens')}>Voir mes liens</button>
              </div>
            </div>

            <div className="settings-block">
              <div className="settings-row" style={{ borderTop: 'none', paddingTop: 4 }}>
                <div><div className="label">Apparence</div><div className="desc">Fond d&apos;écran du site</div></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => setTheme('dark')}
                    style={theme === 'dark' ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}}
                  >
                    ● Noir
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setTheme('light')}
                    style={theme === 'light' ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}}
                  >
                    ○ Blanc
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-block">
              <div className="settings-row" style={{ borderTop: 'none', paddingTop: 4 }}>
                <div><div className="label">Email</div><div className="desc">{affiliate.email}</div></div>
              </div>
            </div>

            <div className="settings-block">
              <div className="settings-row" style={{ borderTop: 'none', paddingTop: 4 }}>
                <div><div className="label">Contact</div><div className="desc">Une question ? Appelle-nous au 07 80 11 27 07</div></div>
                <a className="btn-ghost" href="tel:0780112707" style={{ textDecoration: 'none', textAlign: 'center' }}>Appeler</a>
              </div>
            </div>

            <button className="btn-ghost" style={{ borderColor: '#f87171', color: '#f87171' }} onClick={handleLogout}>Déconnexion</button>
          </section>
        )}
      </main>
    </div>
  )
}
