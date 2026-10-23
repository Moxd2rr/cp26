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

**Pas de mot de passe pour la destinataire** : la clé est intégrée au site au moment du build, à partir de `CP26_PASSPHRASE`. Conséquence à connaître : **toute personne qui a l'adresse du site peut lire les lettres**. L'adresse doit donc rester privée. Les moteurs de recherche sont exclus (`noindex`, `robots.txt`). Le site ne contacte aucun service tiers et ses polices sont auto-hébergées.

## Commandes

```bash
npm install
npm run passphrase      # génère une phrase secrète → .env.local : CP26_PASSPHRASE=…
npm run seal            # chiffre content/ → public/vault/ (rapport : infos manquantes, citations vérifiées)
npm run dev             # site en local : http://localhost:5173
npm run build           # site statique dans dist/ (clé intégrée si CP26_PASSPHRASE est défini)
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

Le site est statique.

- **Netlify** : importer le dépôt (`netlify.toml` fourni) et ajouter la variable d'environnement `CP26_PASSPHRASE`.
- **Vercel** : importer le dépôt (framework Vite, `vercel.json` fourni) et ajouter `CP26_PASSPHRASE`.
- **Cloudflare Pages** : commande `npm run build`, dossier `dist`, variable `CP26_PASSPHRASE`.

Envoyer ensuite simplement l'adresse du site.
