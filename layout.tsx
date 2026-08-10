import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spark Idea — Affiliation',
  description: "Programme d'affiliation Spark Idea",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
