import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

function generateReferralCode(email: string) {
  const prefix = email.slice(0, 2).toUpperCase() 
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${suffix}`
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
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
        <h2>Crée ton compte affilié</h2>
        <p>Rejoins le programme et commence à gagner des commissions sur chaque client que tu ramènes.</p>

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
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </button>

        <div className="auth-switch-link" style={{ marginTop: 10 }}>
          ⚠️ Étape suivante obligatoire : connexion de ton compte Stripe, pour pouvoir être payé.
        </div>
      </form>
    </div>
  )
}
