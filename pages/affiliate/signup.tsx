import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

const ADMIN_DEMO_CODE = '2909.42'

function generateReferralCode(email: string) {
  const cleanPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
  const prefix = (cleanPrefix.slice(0, 3) || 'SPK').toUpperCase()
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}${randomStr}`
}

export default function AffiliateSignupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Veuillez entrer une adresse email valide.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (loginError) {
          if (loginError.message.includes('Invalid login credentials')) {
            setError('Email ou mot de passe incorrect.')
          } else {
            setError(loginError.message)
          }
          return
        }
        router.push('/dashboard')
        return
      }

      // Mode Inscription (Public)
      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      })

      if (signupError || !data.user) {
        if (signupError?.message?.toLowerCase().includes('already registered') || signupError?.message?.toLowerCase().includes('already in use')) {
          setError('Un compte existe déjà avec cet email. Veuillez vous connecter.')
        } else {
          setError(signupError?.message ?? "Erreur lors de l'inscription.")
        }
        return
      }

      // Tenter d'insérer l'affilié avec tentative de gestion des collisions de referral_code
      let inserted = false
      let attempts = 0
      let lastInsertError: any = null

      while (!inserted && attempts < 5) {
        attempts++
        const refCode = generateReferralCode(cleanEmail)
        const { error: insertError } = await supabase.from('affiliates').insert({
          id: data.user.id,
          email: cleanEmail,
          referral_code: refCode,
        })

        if (!insertError) {
          inserted = true
        } else {
          lastInsertError = insertError
          // Si c'est déjà inséré pour cet id utilisateur (ex: retry)
          if (insertError.code === '23505' && insertError.message?.includes('affiliates_pkey')) {
            inserted = true; // Utilisateur déjà créé dans la table
          }
        }
      }

      if (!inserted) {
        console.error('Erreur insertion affiliate:', lastInsertError)
        setError(`Compte créé mais erreur lors de l'initialisation : ${lastInsertError?.message ?? 'Erreur inconnue'}`)
        return
      }

      // Redirection vers l'intégration Stripe Connect
      window.location.href = '/api/stripe-connect'
    } catch (err) {
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
        <h2>{mode === 'signup' ? 'Inscris-toi au programme affilié' : 'Connecte-toi'}</h2>
        <p>
          {mode === 'signup'
            ? 'Crée ton compte en 1 minute et obtiens immédiatement ton lien de tracking personnel pour commencer à toucher des commissions.'
            : 'Retrouve ton dashboard affilié et tes statistiques.'}
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
          {loading ? 'Chargement...' : mode === 'signup' ? 'Créer mon compte affilié' : 'Se connecter'}
        </button>

        {mode === 'signup' && (
          <div className="auth-switch-link" style={{ marginTop: 10 }}>
            ⚠️ Étape suivante : connexion de ton compte Stripe pour recevoir tes commissions automatiques.
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
