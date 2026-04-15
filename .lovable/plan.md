

# Plan : Intégration de Puter.js pour la génération d'images gratuite et illimitée

## Contexte

Actuellement, la génération d'images passe par une Edge Function qui appelle Pollinations.ai. Tu souhaites une solution gratuite, illimitée, et qui ne consomme pas tes crédits Lovable.

**Puter.js** est la meilleure option : c'est une API 100% gratuite, sans clé API, sans limite, qui donne accès a des modeles de haute qualité (FLUX, etc.) directement depuis le navigateur.

## Modifications prevues

### 1. Ajouter le script Puter.js dans `index.html`
- Ajouter `<script src="https://js.puter.com/v2/"></script>` dans le `<head>`

### 2. Modifier la generation d'image cote client dans `RouteMaster.tsx`
- Remplacer l'appel a l'Edge Function `generate-vehicle` par un appel direct a `puter.ai.txt2img(prompt)` dans le navigateur
- Construire le prompt cote client (le code du prompt est deja dans l'Edge Function, on le duplique cote client)
- Convertir le blob retourne en fichier et l'uploader vers le bucket `vehicle-images` via Supabase Storage
- Conserver l'Edge Function Pollinations.ai comme **fallback automatique** si Puter.js echoue

### 3. Ajouter une declaration TypeScript pour Puter
- Creer un fichier `src/puter.d.ts` pour declarer le type global `puter` et eviter les erreurs TypeScript

### 4. Flow de generation

```text
Utilisateur clique "Generer"
       |
       v
  puter.ai.txt2img(prompt)
       |
   Succes ?
   /      \
  Oui      Non
  |         |
  v         v
Upload    Edge Function
Storage   Pollinations (fallback)
  |         |
  v         v
  URL publique affichee
```

## Details techniques

- Puter.js s'execute entierement dans le navigateur, aucun serveur necessaire
- Aucune cle API, aucun credit, aucune limite
- L'upload vers le bucket `vehicle-images` reste identique (Supabase Storage)
- Le prompt (descriptions vehicules, couleurs, accessoires) est reconstruit cote client a partir des memes donnees
- L'Edge Function `generate-vehicle` reste deployee et sert de fallback

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `index.html` | Ajout script Puter.js |
| `src/puter.d.ts` | Declaration TypeScript globale |
| `src/pages/RouteMaster.tsx` | Logique de generation via Puter + fallback |

