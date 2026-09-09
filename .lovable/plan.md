

# Plan : Correction des problèmes de véhicules et génération d'images

## Problèmes identifiés

1. **Erreur 404 Gemini** : Le modèle `gemini-2.0-flash-exp` n'existe plus. Les logs montrent clairement `models/gemini-2.0-flash-exp is not found`. Il faut migrer vers un modèle valide qui supporte la génération d'images.

2. **Pas de régénération lors d'un second achat de véhicule** : Quand un utilisateur achète un second véhicule, l'image est générée mais si la génération échoue (à cause du bug #1), `vehicleImageUrl` reste `undefined` et l'ancienne image n'est pas remplacée non plus.

3. **Impossible de retirer un accessoire ou changer de couleur** : Une fois un item acheté et marqué "POSSÉDÉ", il n'y a aucun bouton pour le désactiver/réactiver. Le système applique automatiquement TOUS les items possédés via `getCustomizeFromOwnedItems`.

4. **Impossible de changer une couleur déjà achetée** : Si l'utilisateur achète "Peinture Rouge" puis "Peinture Bleue", les deux sont dans `ownedItems` mais `getCustomizeFromOwnedItems` applique la dernière trouvée dans la boucle, sans contrôle utilisateur.

## Modifications prévues

### 1. Edge Function — Corriger le modèle Gemini
**Fichier** : `supabase/functions/generate-vehicle/index.ts`
- Remplacer `gemini-2.0-flash-exp` par `gemini-2.0-flash` (modèle stable qui supporte la génération d'images via l'API Gemini directe)
- Ajouter un fallback : si le premier modèle échoue en 404, essayer `imagen-3.0-generate-002`

### 2. Boutique — Ajouter la gestion d'équipement/déséquipement
**Fichier** : `src/pages/RouteMaster.tsx`

- Ajouter un état `equippedItems` dans le type `User` (ou utiliser `customize` comme source de vérité pour ce qui est ÉQUIPÉ vs POSSÉDÉ)
- Pour les items déjà possédés : afficher un bouton **"ÉQUIPER"** / **"RETIRER"** au lieu du simple badge "POSSÉDÉ"
- Équiper/retirer un accessoire ou une peinture :
  - Met à jour `customize` en conséquence
  - Déclenche une régénération d'image
- Pour les peintures : une seule peinture active à la fois — équiper une nouvelle peinture désactive l'ancienne
- Conserver la liste `ownedItems` pour savoir ce qui est acheté, utiliser `customize` pour ce qui est actif

### 3. Régénération d'image fiable
**Fichier** : `src/pages/RouteMaster.tsx`
- Lors de l'achat d'un second véhicule : s'assurer que `vehicleImageUrl` est remis à `undefined` si la génération échoue, au lieu de garder l'ancienne image du véhicule précédent
- Afficher un message d'erreur clair si la génération échoue, avec un bouton "Réessayer"

### 4. Bouton "Régénérer l'image"
- Ajouter un bouton sous l'aperçu du véhicule permettant de relancer manuellement la génération

## Détails techniques

- Modèle Gemini : `gemini-2.0-flash` avec endpoint `v1beta/models/gemini-2.0-flash:generateContent`
- L'upload vers le bucket `vehicle-images` reste inchangé
- Les items possédés (`ownedItems`) restent la source de vérité pour les achats
- L'objet `customize` devient la source de vérité pour la configuration active du véhicule
- Un nouveau handler `handleToggleItem` gère l'équipement/déséquipement + régénération

