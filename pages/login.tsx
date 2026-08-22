import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
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
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

      if (loginError) {
        setError(loginError.message)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('Erreur inattendue login:', err)
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
        <h2>Connecte-toi</h2>
        <p>Retrouve ton dashboard affilié.</p>

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
            required
          />
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="auth-btn-full" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div className="auth-switch-link">
          Pas encore de compte ? <Link href="/signup">S&apos;inscrire</Link>
        </div>
      </form>
    </div>
  )
}
