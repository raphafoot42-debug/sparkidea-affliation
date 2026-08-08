'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({ email, password })

    if (signupError || !data.user) {
      setError(signupError?.message ?? "Erreur lors de l'inscription")
      setLoading(false)
      return
    }

    // Crée la fiche affilié associée, avec un lien de parrainage unique
    const { error: insertError } = await supabase.from('affiliates').insert({
      id: data.user.id,
      email,
      referral_code: generateReferralCode(email),
    })

    if (insertError) {
      setError("Compte créé mais erreur lors de l'initialisation. Contacte le support.")
      setLoading(false)
      return
    }

    // Étape 2 obligatoire : connexion Stripe (voir /api/stripe/connect)
    window.location.href = '/api/stripe/connect'
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Crée ton compte affilié</h2>
      <input
        type="email"
        placeholder="toi@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Création en cours...' : 'Créer mon compte'}
      </button>
      <p className="notice">
        ⚠️ Étape suivante obligatoire : connexion de ton compte Stripe, pour pouvoir être payé.
      </p>
    </form>
  )
}
