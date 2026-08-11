-- Correction : il manquait la permission d'INSERTION dans la table affiliates.
-- Sans elle, l'inscription crée bien le compte (auth) mais échoue à créer
-- la fiche affilié juste après (RLS bloque silencieusement l'insert).

create policy "Un utilisateur peut créer sa propre fiche affilié"
  on affiliates for insert
  with check (auth.uid() = id);
