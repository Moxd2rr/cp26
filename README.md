# Chapitre 26

Un cadeau d'anniversaire numérique : des lettres à ouvrir une par une, comme des enveloppes, puis une animation finale d'environ une minute.

## Confidentialité : tout est chiffré

Ce dépôt est **public**. Les lettres, les photos et les noms n'y apparaissent donc **jamais en clair** :

| Élément | Où | Versionné ? |
|---|---|---|
| Lettres, photos, réglages en clair | `content/` | **Non** (ignoré par Git) |
| Coffre chiffré publié avec le site | `public/vault/` | Oui (illisible sans la clé) |
| Phrase secrète | `.env.local` | **Non** |

- Chiffrement **AES-256-GCM**. La clé est dérivée de la phrase secrète par **PBKDF2-SHA256 × 600 000** : chaque essai de clé coûte cher, ce qui rend une attaque par force brute irréaliste avec une phrase de 5 mots.
- Le déchiffrement se fait **dans le navigateur** du destinataire. L'hébergeur ne voit que des octets illisibles : un lien qui fuite ne suffit pas pour lire.
- **Lien magique** : `https://…/#cle=…`. La partie après `#` n'est jamais envoyée au serveur. Elle est effacée de la barre d'adresse dès l'ouverture.
- « Se souvenir de cet appareil » garde la clé dérivée dans le navigateur. « Refermer le coffret » l'efface.
- Ce qui reste visible sans la clé : le nombre et la taille des fichiers chiffrés, et la page d'accueil verrouillée (sans le prénom).
- Le site ne contacte aucun service tiers : polices auto-hébergées, aucune statistique. Les en-têtes `noindex`, CSP et `no-referrer` sont fournis (`public/_headers`, `vercel.json`).

## Commandes

```bash
npm install
npm run passphrase      # génère une phrase secrète → à mettre dans .env.local (CP26_PASSPHRASE=…)
npm run seal            # chiffre content/ → public/vault/ et affiche le rapport (infos manquantes, citations vérifiées)
npm run dev             # site en local : http://localhost:5173
npm run build           # site statique dans dist/
npm run link -- https://mon-site.netlify.app   # affiche le lien magique à envoyer
npm run test:e2e        # parcours complet mobile + ordinateur (site lancé via `npx vite preview --port 4173`)
```

Sur une nouvelle machine, `npm run content:open` (avec la phrase secrète) reconstruit `content/` à partir du coffre chiffré.

## Ajouter ou modifier une lettre

1. Créer `content/letters/NN-nom.txt` :
   ```
   ---
   numero: 14
   auteur: Prénom Nom
   signature: Prénom        # facultatif
   ambiance: or             # or, aube, rose, ambre, nuit, bordeaux, minuit
   photos:
     - fichier: photo.jpg   # dans content/photos/
       legende: …           # facultatif
   ---
   Le texte intégral, tel quel.
   ```
2. `npm run seal`, puis committer `public/vault/`.

Le texte n'est jamais retouché. Les symboles WhatsApp (`*gras*`, `_italique_`) sont affichés comme mise en forme ; les mots restent identiques.
Les réglages de l'accueil, de l'introduction et de l'animation finale sont dans `content/experience.yaml`. Chaque citation de la finale est vérifiée mot pour mot dans la lettre d'origine au moment du scellement.

## Déployer

Le site est statique et le coffre chiffré est déjà dans le dépôt : **aucun secret n'est nécessaire chez l'hébergeur**.

- **Netlify** : importer le dépôt (`netlify.toml` est fourni), ou glisser le dossier `dist/` sur app.netlify.com/drop.
- **Vercel** : importer le dépôt (framework Vite, `vercel.json` fourni).
- **Cloudflare Pages** : commande `npm run build`, dossier `dist`.

Envoyer ensuite le lien magique (`npm run link -- <adresse du site>`), ou l'adresse et la clé séparément.
