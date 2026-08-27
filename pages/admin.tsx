import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const pageTitles: Record<string, string> = {
  'ad-overview': "Vue d'ensemble",
  'ad-affilies': 'Affiliés',
  'ad-packs': 'Packs',
  'ad-messages': 'Messages',
  'ad-parametres': 'Paramètres',
}

type AdminAffiliate = {
  id: string
  email: string
  referral_code: string
  cpa_amount_cents: number
  active_clients_count: number
  stripe_connected: boolean
  revenue_total_cents: number
  revenue_this_month_cents: number
}
type AdminPack = {
  id: string
  title: string
  description: string
  reward_cents: number
  target_count: number | null
  ends_at: string | null
  active: boolean
}
type AdminMessage = { id: string; affiliate_id: string; sender: string; body: string; created_at: string }

function euros(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
// Coloration purement visuelle du pill CPA dans le tableau — n'a plus
// aucun effet sur le montant réellement versé (ça, c'est cpa_amount_cents,
// modifié à la main par le manager, jamais recalculé automatiquement).
function tierClass(cpaCents: number) {
  if (cpaCents >= 10000) return 't4'  // 100 € et plus
  if (cpaCents >= 5000) return 't3'   // 50 à 99 €
  if (cpaCents >= 3000) return 't2'   // 30 à 49 €
  return 't1'                          // en dessous
}

// Empêche Next.js de pré-générer cette page en statique au moment du build.
export async function getServerSideProps() {
  return { props: {} }
}

export default function Admin() {
  const router = useRouter()

  const [checkingAccess, setCheckingAccess] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ad-overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
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

  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminAffiliate | null>(null)
  const [detailCpaEuros, setDetailCpaEuros] = useState(15)
  const [savingDetail, setSavingDetail] = useState(false)

  const [packs, setPacks] = useState<AdminPack[]>([])
  const [showPackForm, setShowPackForm] = useState(false)
  const [packTitle, setPackTitle] = useState('')
  const [packDesc, setPackDesc] = useState('')
  const [packReward, setPackReward] = useState('')

  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [msgAffiliates, setMsgAffiliates] = useState<{ id: string; email: string }[]>([])
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createType, setCreateType] = useState<'level1' | 'sub'>('level1')
  const [createParentCode, setCreateParentCode] = useState('')
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<{ inviteLink: string; referralCode: string } | null>(null)
  const [copiedInvite, setCopiedInvite] = useState(false)

  // ⚠️ Vérification d'accès CÔTÉ NAVIGATEUR UNIQUEMENT — voir le TODO dans
  // pages/signup.tsx. Ce n'est pas une vraie protection : quelqu'un qui
  // connaît/devine la route peut contourner ce sessionStorage. Les vraies
  // routes API admin ont elles-mêmes leur propre TODO de vérification.
  useEffect(() => {
    const hasAccess = typeof window !== 'undefined' && sessionStorage.getItem('sparkidea_admin_access') === '1'
    if (!hasAccess) {
      router.replace('/signup')
      return
    }
    setCheckingAccess(false)
  }, [router])

  useEffect(() => {
    if (checkingAccess) return
    async function load() {
      const [affRes, packRes, msgRes] = await Promise.all([
        fetch('/api/admin-affiliates').then((r) => r.json()),
        fetch('/api/admin-packs').then((r) => r.json()),
        fetch('/api/admin-messages').then((r) => r.json()),
      ])
      setAffiliates(affRes.affiliates ?? [])
      setPacks(packRes.packs ?? [])
      setMessages(msgRes.messages ?? [])
      setMsgAffiliates(msgRes.affiliates ?? [])
      if (msgRes.affiliates?.length) setSelectedConvo(msgRes.affiliates[0].id)
      setLoading(false)
    }
    load()
  }, [checkingAccess])

  function nav(tab: string) {
    setActiveTab(tab)
    setDrawerOpen(false)
    setProfileMenuOpen(false)
  }

  function openDetail(a: AdminAffiliate) {
    setSelected(a)
    setDetailCpaEuros(a.cpa_amount_cents / 100)
  }

  async function saveDetail() {
    if (!selected) return
    setSavingDetail(true)
    const res = await fetch('/api/affiliate-cpa', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, cpaAmountEuros: detailCpaEuros }),
    })
    setSavingDetail(false)
    if (res.ok) {
      const cpaAmountCents = Math.round(detailCpaEuros * 100)
      setAffiliates((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, cpa_amount_cents: cpaAmountCents } : a))
      )
      setSelected(null)
    }
  }

  async function createPack() {
    const rewardEuros = parseFloat(packReward.replace(',', '.'))
    if (!packTitle.trim() || !packDesc.trim() || !rewardEuros) return
    const res = await fetch('/api/packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: packTitle.trim(), description: packDesc.trim(), rewardEuros }),
    })
    if (res.ok) {
      const { pack } = await res.json()
      setPacks((prev) => [pack, ...prev])
      setPackTitle('')
      setPackDesc('')
      setPackReward('')
      setShowPackForm(false)
    }
  }

  async function sendAdminReply() {
    if (!replyDraft.trim() || !selectedConvo) return
    const res = await fetch('/api/admin-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliateId: selectedConvo, body: replyDraft.trim() }),
    })
    if (res.ok) {
      const { message } = await res.json()
      setMessages((prev) => [...prev, message])
      setReplyDraft('')
    }
  }

  async function createAffiliate() {
    if (!createEmail.trim()) {
      setCreateError('Email requis')
      return
    }
    if (createType === 'sub' && !createParentCode) {
      setCreateError('Choisis un affilié parent')
      return
    }
    setCreating(true)
    setCreateError(null)
    setCreateResult(null)
    try {
      const res = await fetch('/api/admin-create-affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail.trim(),
          type: createType,
          parentReferralCode: createType === 'sub' ? createParentCode : undefined,
          name: createName.trim() || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setCreateError(body.error ?? 'Erreur lors de la création')
        return
      }
      setCreateResult(body)
      // On rafraîchit la liste pour voir apparaître le nouveau compte tout de suite.
      const affRes = await fetch('/api/admin-affiliates').then((r) => r.json())
      setAffiliates(affRes.affiliates ?? [])
    } catch {
      setCreateError('Erreur réseau, réessaie.')
    } finally {
      setCreating(false)
    }
  }

  function resetCreateForm() {
    setShowCreateForm(false)
    setCreateEmail('')
    setCreateType('level1')
    setCreateParentCode('')
    setCreateName('')
    setCreateError(null)
    setCreateResult(null)
  }

  if (checkingAccess || loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{ textAlign: 'center' }}>Chargement...</div>
      </div>
    )
  }

  const filteredAffiliates = affiliates.filter((a) =>
    a.email.toLowerCase().includes(search.toLowerCase())
  )
  const totalClients = affiliates.reduce((s, a) => s + a.active_clients_count, 0)
  const totalThisMonth = affiliates.reduce((s, a) => s + a.revenue_this_month_cents, 0)
  const totalRevenue = affiliates.reduce((s, a) => s + a.revenue_total_cents, 0)
  const convoMessages = messages.filter((m) => m.affiliate_id === selectedConvo)
  const selectedAffiliateEmail = msgAffiliates.find((a) => a.id === selectedConvo)?.email ?? ''

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
            <div className="avatar">AD</div>
            <span className="name">Admin</span>
            <span className="chev">▾</span>
          </div>
          {profileMenuOpen && (
            <div className="profile-menu active">
              <a href="#" className="danger" onClick={(e) => { e.preventDefault(); sessionStorage.removeItem('sparkidea_admin_access'); router.replace('/signup') }}>Déconnexion</a>
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
        <div className="drawer-eyebrow">Espace admin</div>
        {[
          ['ad-overview', '◆', "Vue d'ensemble"],
          ['ad-affilies', '☰', 'Affiliés'],
          ['ad-packs', '🎁', 'Packs'],
          ['ad-messages', '✉', 'Messages'],
          ['ad-parametres', '⚙', 'Paramètres'],
        ].map(([key, icon, label]) => (
          <div key={key} className={`drawer-item${activeTab === key ? ' active' : ''}`} onClick={() => nav(key)}>
            <span className="ic">{icon}</span> {label}
          </div>
        ))}
      </div>

      <main>
        {activeTab === 'ad-overview' && (
          <section className="page active">
            <div className="eyebrow">Espace admin</div>
            <h1>Affiliation — vue d&apos;ensemble</h1>
            <div className="sub">Suivi global du programme.</div>

            <div className="stats">
              <div className="stat c-cyan"><div className="label">Affiliés</div><div className="value">{affiliates.length}</div></div>
              <div className="stat c-violet"><div className="label">Clients apportés (total)</div><div className="value accent">{totalClients}</div></div>
              <div className="stat c-or"><div className="label">Commissions versées ce mois</div><div className="value">{euros(totalThisMonth)}</div></div>
              <div className="stat c-vert"><div className="label">Commissions versées (total)</div><div className="value">{euros(totalRevenue)}</div></div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Top affiliés</h3>
              {[...affiliates].sort((a, b) => b.revenue_total_cents - a.revenue_total_cents).slice(0, 5).map((a, i) => (
                <div className="leader-row" key={a.id}>
                  <div className="leader-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                  <div className="leader-avatar">{a.email.slice(0, 2).toUpperCase()}</div>
                  <div className="leader-name">{a.email}</div>
                  <div className="leader-value">{euros(a.revenue_total_cents)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'ad-affilies' && (
          <section className="page active">
            <div className="eyebrow">Espace admin</div>
            <h1>Affiliés</h1>
            <div className="sub">Gère les comptes et ajuste leurs paramètres.</div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="admin-toolbar">
                <h3 style={{ margin: 0 }}>Créer un affilié directement</h3>
                <button className="btn-primary" onClick={() => setShowCreateForm((v) => !v)}>
                  {showCreateForm ? 'Fermer' : '+ Créer un compte'}
                </button>
              </div>
              {showCreateForm && (
                <div style={{ marginTop: 14 }}>
                  {createResult ? (
                    <div>
                      <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 10 }}>
                        ✅ Compte créé (code {createResult.referralCode}). Envoie-lui ce lien pour qu&apos;il se connecte
                        directement et n&apos;ait plus qu&apos;à connecter son Stripe :
                      </div>
                      <div className="link-tag" style={{ marginBottom: 10, wordBreak: 'break-all' }}>{createResult.inviteLink}</div>
                      <button
                        className="copy"
                        onClick={() => {
                          navigator.clipboard.writeText(createResult.inviteLink)
                          setCopiedInvite(true)
                          setTimeout(() => setCopiedInvite(false), 1500)
                        }}
                      >
                        {copiedInvite ? 'Copié !' : 'Copier le lien'}
                      </button>
                      <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={resetCreateForm}>Créer un autre compte</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Type de compte</label>
                        <select
                          value={createType}
                          onChange={(e) => setCreateType(e.target.value as 'level1' | 'sub')}
                          style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                        >
                          <option value="level1">Affilié niveau 1</option>
                          <option value="sub">Sous-affilié (rattaché)</option>
                        </select>
                      </div>
                      {createType === 'sub' && (
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Rattaché à</label>
                          <select
                            value={createParentCode}
                            onChange={(e) => setCreateParentCode(e.target.value)}
                            style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                          >
                            <option value="">— choisir —</option>
                            {affiliates.map((a) => (
                              <option key={a.id} value={a.referral_code}>{a.email} ({a.referral_code})</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Email</label>
                        <input
                          type="email"
                          placeholder="personne@email.com"
                          value={createEmail}
                          onChange={(e) => setCreateEmail(e.target.value)}
                          style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nom (optionnel)</label>
                        <input
                          type="text"
                          placeholder="Ex : Nathan"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <button className="btn-primary" onClick={createAffiliate} disabled={creating}>
                        {creating ? 'Création...' : 'Créer'}
                      </button>
                    </div>
                  )}
                  {createError && <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 10 }}>{createError}</div>}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
                    Le compte et sa commission automatique sont créés tout de suite. Seule étape qui reste à la
                    personne : cliquer le lien puis connecter son Stripe (obligatoire côté Stripe, impossible de le
                    faire à sa place).
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="admin-toolbar">
                <h3 style={{ margin: 0 }}>Liste des affiliés</h3>
                <input className="search" placeholder="Rechercher un affilié..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <table>
                <thead><tr><th>Affilié</th><th>CPA actuel</th><th>Clients actifs</th><th>Revenu généré</th><th>Payé ce mois</th><th>Stripe</th></tr></thead>
                <tbody>
                  {filteredAffiliates.map((a) => (
                    <tr key={a.id} onClick={() => openDetail(a)} style={{ cursor: 'pointer' }}>
                      <td>{a.email}</td>
                      <td><span className={`pill ${tierClass(a.cpa_amount_cents)}`}>{euros(a.cpa_amount_cents)}</span></td>
                      <td>{a.active_clients_count}</td>
                      <td>{euros(a.revenue_total_cents)}</td>
                      <td>{euros(a.revenue_this_month_cents)}</td>
                      <td>{a.stripe_connected ? '✅ Connecté' : '⏳ En attente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>Clique sur un affilié pour voir sa fiche et ajuster ses paramètres.</div>
            </div>
          </section>
        )}

        {activeTab === 'ad-packs' && (
          <section className="page active">
            <div className="eyebrow">Espace admin</div>
            <h1>Packs à gagner</h1>
            <div className="sub">Crée des défis bonus visibles par tous les affiliés.</div>

            <div className="admin-toolbar">
              <h3 style={{ margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>Packs</h3>
              <button className="btn-primary" onClick={() => setShowPackForm((v) => !v)}>+ Créer un pack</button>
            </div>

            {showPackForm && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="field">
                  <label>Titre</label>
                  <div className="row-input"><input type="text" value={packTitle} onChange={(e) => setPackTitle(e.target.value)} placeholder="Sprint de la semaine" style={{ width: '100%', fontFamily: "'Inter',sans-serif", fontSize: 13 }} /></div>
                </div>
                <div className="field">
                  <label>Description / conditions</label>
                  <div className="row-input"><input type="text" value={packDesc} onChange={(e) => setPackDesc(e.target.value)} placeholder="Ramène 10 clients sur le forfait 74€..." style={{ width: '100%', fontFamily: "'Inter',sans-serif", fontSize: 13 }} /></div>
                </div>
                <div className="field">
                  <label>Récompense</label>
                  <div className="row-input"><input type="number" value={packReward} onChange={(e) => setPackReward(e.target.value)} placeholder="100" /> <span className="static">€</span></div>
                </div>
                <div className="detail-actions">
                  <button className="btn-primary" onClick={createPack}>Publier le pack</button>
                  <button className="btn-ghost" onClick={() => setShowPackForm(false)}>Annuler</button>
                </div>
              </div>
            )}

            {packs.length === 0 ? (
              <div className="card" style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun pack pour l&apos;instant.</div>
            ) : (
              <div className="packs-grid">
                {packs.map((p, i) => (
                  <div className={`pack-card ${i % 2 === 0 ? 'p-violet' : 'p-vert'}`} key={p.id}>
                    <div className="pack-reward">+{euros(p.reward_cents)}</div>
                    <div className="pack-title">{p.title}</div>
                    <div className="pack-desc">{p.description}</div>
                    <div className="pack-meta">
                      <span>{p.active ? 'Actif' : 'Inactif'}</span>
                      <span>{p.ends_at ? `Fin le ${new Date(p.ends_at).toLocaleDateString('fr-FR')}` : 'Sans date de fin'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'ad-messages' && (
          <section className="page active">
            <div className="eyebrow">Espace admin</div>
            <h1>Messages</h1>
            <div className="sub">Toutes les conversations avec tes affiliés.</div>

            <div className="msg-layout">
              <div className="msg-list">
                {msgAffiliates.map((a) => (
                  <div
                    className={`msg-list-item${selectedConvo === a.id ? ' active' : ''}`}
                    key={a.id}
                    onClick={() => setSelectedConvo(a.id)}
                  >
                    <div className="leader-avatar">{a.email.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="msg-list-name">{a.email}</div>
                      <div className="msg-list-preview">
                        {messages.filter((m) => m.affiliate_id === a.id).slice(-1)[0]?.body ?? 'Pas encore de message'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="msg-thread">
                <div className="msg-thread-head">{selectedAffiliateEmail || '—'}</div>
                <div className="msg-scroll">
                  {convoMessages.map((m) => (
                    <div className={`bubble ${m.sender === 'admin' ? 'out' : 'in'}`} key={m.id}>
                      {m.body}
                      <div className="bubble-time">{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
                <div className="msg-input-row">
                  <input
                    type="text"
                    placeholder="Répondre..."
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendAdminReply()}
                  />
                  <button className="btn-primary" onClick={sendAdminReply}>Envoyer</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'ad-parametres' && (
          <section className="page active">
            <div className="eyebrow">Espace admin</div>
            <h1>Paramètres</h1>
            <div className="sub">Préférences de l&apos;espace admin.</div>

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
                <div><div className="label">Contact</div><div className="desc">Une question ? Appelle-nous au 07 80 11 27 07</div></div>
                <a className="btn-ghost" href="tel:0780112707" style={{ textDecoration: 'none', textAlign: 'center' }}>Appeler</a>
              </div>
            </div>

            <button
              className="btn-ghost"
              style={{ borderColor: '#f87171', color: '#f87171' }}
              onClick={() => { sessionStorage.removeItem('sparkidea_admin_access'); router.replace('/signup') }}
            >
              Déconnexion
            </button>
          </section>
        )}
      </main>

      {selected && (
        <div className="overlay active">
          <div className="detail-panel">
            <div className="detail-head">
              <h3>{selected.email}</h3>
              <button className="close-x" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="detail-sub">{selected.active_clients_count} clients actifs</div>
            <div className="field">
              <label>CPA actuel (par client validé)</label>
              <div className="row-input">
                <input type="number" value={detailCpaEuros} min={0} step={1} onChange={(e) => setDetailCpaEuros(Number(e.target.value))} /> <span className="static">€</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                Ce montant s&apos;applique uniquement aux <b style={{ color: 'var(--text)' }}>futurs</b> clients de cet
                affilié. Les clients déjà ramenés gardent le CPA qui leur a été appliqué au moment de leur
                validation — rien n&apos;est recalculé rétroactivement.
              </div>
            </div>
            <div className="field">
              <label>Statut du compte Stripe</label>
              <div className="row-input"><span className="static">{selected.stripe_connected ? 'Connecté' : 'En attente'}</span></div>
            </div>
            <div className="detail-actions">
              <button className="btn-primary" onClick={saveDetail} disabled={savingDetail}>{savingDetail ? 'Enregistrement...' : 'Enregistrer'}</button>
              <button className="btn-ghost" onClick={() => setSelected(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
