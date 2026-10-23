# Chapitre 26

Un cadeau d'anniversaire numérique. Un grand cadeau s'ouvre, les lettres des proches en sortent et se posent sur la table. On les ouvre une à une, comme de vraies enveloppes. La dernière mène à une animation finale d'environ une minute, sur une musique douce.

## Parcours

1. **Accueil** : la lampe s'allume, le prénom s'écrit à la main.
2. **Introduction** : un petit mot qui invite à prendre son temps.
3. **Le cadeau** : toucher le ruban. Le nœud se défait, le couvercle s'envole, les lettres sortent et se rangent sur la table.
4. **Les enveloppes** : chacune porte le nom de l'expéditeur, un timbre numéroté et un cachet. Une fois ouverte, elle reçoit le tampon « Ouverte ».
5. **Ouverture** : l'enveloppe se retourne, le sceau de cire se brise, le rabat s'ouvre, la lettre sort.
6. **Lecture** : texte intégral, photos, signature, lettre précédente ou suivante.
7. **La dernière lettre**, proposée quand les autres ont été lues, puis **le final** : citations découpées dans les lettres, photo, noms qui se rejoignent, révélation du 26, message final.

La progression (lettres ouvertes, cadeau ouvert, final vu) est mémorisée sur l'appareil.

## Confidentialité

Le dépôt GitHub est **public**. Les lettres, les photos et la musique n'y sont donc **jamais en clair** :

| Élément | Où | Versionné ? |
|---|---|---|
| Lettres, photos, musique, réglages en clair | `content/` | **Non** (ignoré par Git) |
| Coffre chiffré (AES-256-GCM) | `public/vault/` | Oui, illisible sans la clé |
| Phrase secrète | `.env.local` ou variable de l'hébergeur | **Non** |

**Pas de mot de passe à taper.** Deux façons de livrer la clé :

- **GitHub Pages (site public)** : la clé n'est **ni dans le site, ni dans le dépôt**. Elle voyage uniquement dans le **lien personnel** envoyé à la destinataire (`https://…/cp26/#mots-de-la-cle`). La partie après `#` n'est jamais envoyée au serveur, et elle est effacée de la barre d'adresse dès l'ouverture. Le téléphone s'en souvient ensuite. Sans ce lien, le site affiche seulement « Ce cadeau s'ouvre avec le lien qui t'a été envoyé ».
- **Hébergeur privé (Netlify, Vercel…)** : la clé peut être intégrée au build via `CP26_PASSPHRASE`. Dans ce cas, toute personne qui a l'adresse du site peut lire les lettres.

Les moteurs de recherche sont exclus (`noindex`). Le site ne contacte aucun service tiers et ses polices sont auto-hébergées.

## Commandes

```bash
npm install
npm run passphrase      # génère une phrase secrète → .env.local : CP26_PASSPHRASE=…
npm run seal            # chiffre content/ → public/vault/ (rapport : infos manquantes, citations vérifiées)
npm run dev             # site en local : http://localhost:5173
npm run build           # site statique dans dist/ (clé intégrée si CP26_PASSPHRASE est défini)
npm run build:pages     # site pour GitHub Pages dans docs/ (SANS la clé)
npm run link            # affiche le lien personnel à envoyer
npm run compose         # régénère la musique de fond originale (content/music/douceur.mp3)
npm run test:e2e        # parcours complet mobile + ordinateur (après `npx vite preview --port 4173`)
```

Sur une nouvelle machine, `npm run content:open` (avec la phrase secrète) reconstruit `content/` à partir du coffre chiffré.

## Ajouter ou modifier une lettre

1. Créer `content/letters/NN-nom.txt` :
   ```
   ---
   numero: 14
   auteur: Prénom Nom
   signature: Prénom        # facultatif
   ambiance: or             # or, aube, rose, ambre, nuit, bordeaux, minuit (papier, timbre, cire)
   photos:
     - fichier: photo.jpg   # dans content/photos/
       legende: …           # facultatif
   ---
   Le texte intégral, tel quel.
   ```
2. Lancer `npm run seal`, puis committer `public/vault/`.

Le texte n'est jamais retouché. Les symboles WhatsApp (`*gras*`, `_italique_`) s'affichent comme mise en forme, avec les mêmes mots.
Les textes de l'accueil, de l'introduction, du cadeau et du final se règlent dans `content/experience.yaml`. Chaque citation du final est vérifiée mot pour mot dans la lettre d'origine.

## Musique

`douceur.mp3` est une composition originale générée par `scripts/compose.mjs` : une nappe douce et une basse feutrée, sans notes piquées, sans paroles ni percussions. Elle est donc libre de droits. Elle démarre au premier clic, reste à volume bas pendant la lecture et monte un peu pendant le final. Un petit bouton en bas à gauche coupe le son.
Pour une autre musique, déposer un MP3 dans `content/music/` et l'indiquer dans `experience.yaml` (`musique: music/fichier.mp3`).

## Déployer

### GitHub Pages (recommandé ici)

1. `npm run seal && npm run build:pages`, puis committer et pousser `docs/`.
2. Une seule fois, sur GitHub : **Settings → Pages → Build and deployment**. Choisir *Source : Deploy from a branch*, puis la branche du site et le dossier **`/docs`**, et cliquer sur **Save**.
3. Après une à deux minutes, le site est en ligne sur `https://moxd2rr.github.io/cp26/`.
4. `npm run link` affiche le **lien personnel** à envoyer à la destinataire.

### Autres hébergeurs

- **Netlify** : importer le dépôt (`netlify.toml` fourni). Ajouter `CP26_PASSPHRASE` pour intégrer la clé, ou `CP26_NO_EMBED=1` pour utiliser le lien personnel.
- **Vercel** : importer le dépôt (framework Vite, `vercel.json` fourni), avec les mêmes variables.
- **Cloudflare Pages** : commande `npm run build`, dossier `dist`, avec les mêmes variables.
