import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase-client'

// ⚠️ Démo front-end : ce code est visible dans le JS envoyé au navigateur.
// Avant mise en prod, remplacer par une vraie vérification côté serveur
// (route API + colonne is_admin), jamais un code en dur côté client.
const ADMIN_DEMO_CODE = '2909.42'

function generateReferralCode(email: string) {
  const prefix = email.slice(0, 2).toUpperCase()
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${suffix}`
}

export default function SignupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState(false)

  // Présents si on arrive via un lien d'invitation généré par un affilié
  // depuis son onglet Sous-affiliation (voir dashboard.tsx).
  const inviteCode = typeof router.query.invite === 'string' ? router.query.invite : null
  const subCode = typeof router.query.subcode === 'string' ? router.query.subcode : null
  const isInvite = Boolean(inviteCode && subCode)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) {
          setError(loginError.message)
          return
        }
        router.push('/dashboard')
        return
      }

      const { data, error: signupError } = await supabase.auth.signUp({ email, password })

      if (signupError || !data.user) {
        setError(signupError?.message ?? "Erreur lors de l'inscription")
        return
      }

      const { error: insertError } = await supabase.from('affiliates').insert({
        id: data.user.id,
        email,
        referral_code: generateReferralCode(email),
      })

      if (insertError) {
        console.error('Erreur insertion affiliate:', insertError)
        setError(`Compte créé mais erreur lors de l'initialisation : ${insertError.message}`)
        return
      }

      if (isInvite) {
        const activateRes = await fetch('/api/activate-sub-affiliate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newAffiliateId: data.user.id, parentReferralCode: inviteCode, subCode }),
        })
        if (!activateRes.ok) {
          const body = await activateRes.json().catch(() => ({}))
          console.error('Erreur activation sous-affilié:', body?.error)
          // On ne bloque pas l'inscription pour ça : le compte existe déjà,
          // on continue vers Stripe. Le rattachement pourra être corrigé à la main.
        }
      }

      window.location.href = '/api/stripe-connect'
    } catch (err) {
      // Filet de sécurité : n'importe quelle erreur inattendue (réseau, config
      // manquante, etc.) s'affiche maintenant au lieu de bloquer le bouton.
      console.error('Erreur inattendue signup:', err)
      setError(err instanceof Error ? err.message : 'Erreur inattendue, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  function submitAdminCode() {
    if (adminCode.trim() === ADMIN_DEMO_CODE) {
      sessionStorage.setItem('sparkidea_admin_access', '1')
      router.push('/admin')
      return
    }
    setAdminError(true)
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          Spark <em>Idea</em>
        </div>
        <div className="auth-steps-dots">
          <span className="active"></span>
          <span></span>
          <span></span>
        </div>
        <div className="auth-icon step1">✦</div>
        <h2>{isInvite ? 'Rejoins l\u2019équipe' : mode === 'signup' ? 'Crée ton compte affilié' : 'Connecte-toi'}</h2>
        <p>
          {isInvite
            ? 'Crée ton compte pour être payé automatiquement sur chaque client que tu ramènes, à ton propre taux.'
            : mode === 'signup'
            ? 'Rejoins le programme et commence à gagner des commissions sur chaque client que tu ramènes.'
            : 'Retrouve ton dashboard affilié.'}
        </p>

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="toi@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label>Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="auth-btn-full" disabled={loading}>
          {loading ? 'Chargement...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
        </button>

        {mode === 'signup' && (
          <div className="auth-switch-link" style={{ marginTop: 10 }}>
            ⚠️ Étape suivante obligatoire : connexion de ton compte Stripe, pour pouvoir être payé.
          </div>
        )}

        <div className="auth-switch-link">
          {mode === 'signup' ? (
            <>Déjà un compte ? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError(null) }}>Se connecter</a></>
          ) : (
            <>Pas encore de compte ? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setError(null) }}>S&apos;inscrire</a></>
          )}
        </div>

        <div className="auth-switch-link" style={{ marginTop: 14 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowAdminPanel((v) => !v) }}>Accès admin</a>
        </div>
        {showAdminPanel && (
          <div style={{ marginTop: 14, textAlign: 'left' }}>
            <div className="auth-field" style={{ marginBottom: 10 }}>
              <label>Code admin</label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminCode}
                onChange={(e) => { setAdminCode(e.target.value); setAdminError(false) }}
              />
            </div>
            <button type="button" className="auth-btn-full" style={{ marginTop: 0 }} onClick={submitAdminCode}>
              Valider
            </button>
            {adminError && (
              <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 8 }}>Code invalide.</div>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
