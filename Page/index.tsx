import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          Spark <em>Idea</em>
        </div>
        <div className="auth-step-label">Programme d&apos;affiliation</div>
        <div className="auth-icon step1">✦</div>
        <h2>Deviens affilié Spark Idea</h2>
        <p>Ramène des clients, gagne des commissions récurrentes chaque mois.</p>
        <Link href="/signup" className="auth-btn-full" style={{ display: 'block', textDecoration: 'none' }}>
          Devenir affilié
        </Link>
      </div>
    </div>
  )
}
