import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

// Appelée depuis le site PRINCIPAL Spark Idea (spark-idea-two.vercel.app),
// pas depuis ce projet — c'est volontairement une route publique, sans 
// authentification, pensée pour être appelée cross-domaine.
//
// Pourquoi un pixel image plutôt qu'un fetch() classique : un <img src="..."/>
// se charge cross-domaine sans jamais poser de problème CORS, alors qu'un
// fetch() depuis un autre site nécessiterait de configurer des en-têtes
// Access-Control-Allow-Origin ici. Le pixel est la solution la plus simple
// pour un tracking one-way comme celui-ci.
//
// À coller sur la page d'accueil du site principal Spark Idea, dans le
// <head> ou juste avant </body>, uniquement quand ?ref= est présent :
//
//   {router.query.ref && (
//     <img
//       src={`https://spark-idea-6.vercel.app/api/track-click?code=${router.query.ref}`}
//       width={1} height={1} style={{ display: 'none' }} alt=""
//     />
//   )}
//
// ⚠️ Limitation connue (MVP) : chaque chargement de page incrémente le
// compteur, y compris un simple rafraîchissement (F5) par la même personne.
// Le chiffre est donc une estimation du trafic généré par le lien, pas un
// nombre de visiteurs uniques garantis. Pour du vrai déduplique-par-visiteur,
// il faudrait stocker un cookie/IP par clic — volontairement pas fait ici
// pour rester simple, à améliorer plus tard si besoin de précision.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string | undefined

  if (code) {
    try {
      const admin = createAdminClient()
      const { data: affiliate } = await admin
        .from('affiliates')
        .select('id')
        .eq('referral_code', code)
        .single()

      if (affiliate) {
        await admin.rpc('increment_clicks', { affiliate_id: affiliate.id })
      }
    } catch (err) {
      // On avale l'erreur : le tracking ne doit jamais faire planter la
      // page du site principal qui l'appelle.
      console.error('Erreur track-click:', err)
    }
  }

  // Pixel transparent 1x1, quoi qu'il arrive (même si le code est invalide),
  // pour que le <img> ne casse jamais visuellement côté site principal.
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
    'base64'
  )
  res.setHeader('Content-Type', 'image/gif')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(pixel)
}
