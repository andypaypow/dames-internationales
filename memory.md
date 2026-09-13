# Dames Internationales (bureau_de_travail/dames-international)

## 🎯 Projet
Application web de jeu de dames internationales (10×10, 20 pions, règles FID).

## 📚 Sources PDF archivées (docs/)
- `docs/24775-cours-de-jeu.pdf` (4,7 Mo) — Cours de jeu (jeudedames.toulouse),
  ex. C21.x, C30.x aile droite (p.58-59, sol p.68), C31.x autres enfermés
  (p.64, sol p.69). Texte : pdftotext p.2 = sommaire.
- `docs/24801.pdf` — Fins de parties (jeudedames.toulouse) : 33.x opposition
  (p.40, sol p.55), 34.x dame contre pions, 35-37, **38.x créer un piège
  (exos p.40-41, sol p.55)**, 39-40. Texte : pdftotext, sommaire p.1.
- `docs/enchainements-gregoire-pesente-ffjd.pdf` (0,9 Mo) — « Les enchaînements »,
  marchand de bois p.6+, aile droite p.57+, diag 161-162 p.99-100.
  ⚠️ /tmp est volatile : repartir de ces copies (pipeline : render <pdf> …).
- 🧰 **Skill `/exercices-dames`** (skills/exercices-dames/SKILL.md) : pipeline
  complet d'ajout d'exercices (render → lecture diagrammes → check → merge →
  deploy) + conventions de lecture + pièges — à utiliser pour tout ajout futur.

## ✅ État (v16 — 🪤 Créer un piège, 24801 ch.38)
- **v16** : +6 exos « 🪤 Créer un piège » (24801 p.40-41, sol p.55) : 38.1, 38.3,
  38.4, 38.5, 38.7 (dame blanche 1), 38.8 (dame blanche 32). 38.6 = pas de
  diagramme dans le PDF (sauté). Thème persistant exercices-wip/piege38/.
- Solutions du livre fautives reconstruites au moteur : 38.1 (37x26/44x35 →
  37-26, 44-35… blocage ±999) ; 38.5 (9-3! promotion-embuscade, 3-25 dame
  APRÈS 38x29, suite moteur 25-48 → noirs bloqués).
- Leçon v16 : détection pixels des diagrammes non fiable (gris imprimé partiel,
  bbox qui avale légende/voisin) → lecture VISUELLE avec overlay grille + croix
  avec la solution du livre. Pion empilé dans le diagramme = DAME (wd/bd).
- En ligne (bundle index-BmWMXD5T.js, 83/83 tests).

## 📜 États v7-v15 (condensé — détails dans git log et skill /exercices-dames)
- **v15** (commit 8cd1341) : fix gel exercices (exoSchedule désync → sequences vides ;
  jetons playGen/exoRun contre reset/⏮/↩ pendant une rafle animée) · ▶ Solution auto
  (devient ⏸ Stop) · vitesse 🐌-🚀 0,25×-5× · 🔁 Repeat (rejeu auto 2 s) · statut
  « 🚫 Plus aucun coup légal ». E2E Playwright (Chrome système) OK.
- **v14** : boutons flottants 📚 (menu arborescent thèmes/exos) + 💡 (indice, bulle,
  déplaçable) ; swipe damier (50px, ratio 1.6) + double-clic coins PC ;
  CSS `[hidden]{display:none!important}` (le flex des cartes écrasait hidden).
  ⚠️ Leçon : retirer un bouton HTML sans son handler $().onclick casse TOUT le JS.
- **v13** : +16 exos 24801 (33.x opposition, 34.x dame v pions) ; support DAMES bd/wd.
- **v12** : +4 exos C31.x enfermés (C31.3/6/7/8 écartés, transcriptions douteuses).
- **v11** : +8 exos C30.x aile droite ; `check` accepte la notation ABRÉGÉE du livre
  (sous-séquence, arrivée finale égale, rafle majoritaire la plus courte).
- **v10** : +2 exos AUT.161/162 (diag 162 : 30 blanc absent au départ, formé par 34-30).
- **v9c pipeline** : `scripts/exo-theme.ts` (render/init/show/check/merge/deploy) —
  workflow : render → lecture images → exos.json → check (0 rejet) → merge → deploy.
- **v9** : +10 exos « Les enchaînements » (FFJD) M./A. via valide-enchainements.ts.
  ⚠️ blanc 46 vide si 46-41 joué ; noir 19 absent du diag 17 ; (25x23) = 25x34x23.
- **v9b UX** : Exo.goal 'gain' + Exo.trait ('b'|'w') ; réponse adverse AUTO tant que
  la solution est suivie (exoAutoMove).
- **v7/v8** : mode exercice depuis 24775 ch.21 (15 exos, C21.13 = doublon PDF) ;
  menu exercices ; numérotation 1-50 partout. v6 = Vite+TS strict.
- Repo Vite+TS : `src/{regles,ia,app,exercices,exos-gen}.ts` + `style.css`, `deploy.sh`.
  Commandes : `npm run dev` · `npm test` · `npm run deploy` (build hashé = cache-busting CF).
- Sélection exo : coup unique = direct ; multi = destinations FINALES, clic = rafle entière.
- Fix v1 : applyMove capture → `{...null}` pièce fantôme (fix `nb[end] ?? nb[from]`) ;
  mode 2 joueurs : `init()` doit calculer `sequences` (sinon Noirs immobiles).
- Rafle animée : playMove async case par case, `.piece.taken`, flag `animating` ;
  IA passe par playMove. Pas de surbrillance movable (reste `.sel`, `.move`, `.capt-land`).


## 📜 Historique (v1-v4 — 1 fichier)
- Règles FID : prise obligatoire + majoritaire (récursif), pions avant/arrière, dames volantes, promotion si arrêt dernière rangée, Noirs commencent.
- Modes : Blancs vs IA (minimax alpha-bêta, 3 niveaux) · 2 joueurs même écran. Undo + fin de partie + inversion damier.
- v3/v4 exercices « coup du talon » (5 entraînement + 2 PDF Doubovy) : supprimés en v6. Convention cases 1-50 : r=floor((n-1)/5) ; r pair c=2k+1, impair c=2k.
- `app/index.html` : app autonome (HTML/CSS/JS, zéro dépendance).
- Règles implémentées : prise obligatoire + majoritaire (récursif, multi-sauts),
  pions capturent avant/arrière, dames volantes (portée illimitée, interdiction
  de sauter 2× la même pièce), promotion en dame (si arrêt sur dernière rangée),
  les Noirs commencent.
- Modes : Joueur (Blancs) vs IA (minimax alpha-bêta, 3 niveaux) · 2 joueurs même écran.
- Boutons : nouvelle partie, annuler coup. Détection fin de partie (plus de coups).

## 🌐 Service
- **URL publique : https://dames.filtreexpert.org** (Cloudflare proxied, Flexible SSL → nginx :80)
- VPS : `/var/www/dames/index.html` (chmod 644 obligatoire — scp copie en 600)
- Vhost : `/etc/nginx/sites-enabled/dames-filtreexpert` (statique, port 80)
- DNS : A record `dames` → 158.220.96.181 (proxied, zone Cloudflare 8dc1fda…, token `~/.cloudflare_token` sur le PC local)
- Dev local : `python3 -m http.server 8095` (cwd = app/)
- Redéploiement : `scp app/index.html vps:/var/www/dames/index.html && ssh vps chmod 644 /var/www/dames/index.html`

## 🔍 Tests
- `node --check` sur le JS extrait : OK.
- Tests logiques headless (génération de coups) : 9 coups initiaux Noirs ✓,
  séquences de capture majoritaire ✓, capture dame volante multi-atterrissages ✓.

## 🎓 Modes exercice v3/v4 (historique)
- v4 : PDF Doubovy « Coups basiques » (testjeudedames.free.fr, 198 p., ch.68 coup du
  talon p.77) ; lecture pdfimages → transcription → validation moteur ; menu 📄 pdf1/pdf2 ;
  inversion damier 🔄 (classe .flip, dataset inchangé).
- v3 : 5 talons entraînement (ex. 25,28,30,32,40 / 8,13,15,19,23 → 30-24) ; Wikipédia →
  rotation 180° + échange couleurs. Cases 1-50 → (r,c) : r=(n-1)/5 ; r pair c=2k+1, impair c=2k.


## 🐛 Erreurs & solutions
- **Bug minimax** : `search()` utilisait `-col` sur une string ('w'/'b') → NaN → l'IA jouait quasi au hasard. Fix : `opp=col==='w'?'b':'w'`. Toujours vérifier les types avant d'utiliser un opérateur unaire `-`.
- **Signes search** : + = bon pour les Noirs (evalBoard), +999 = Blancs bloqués. Lire les scores AVEC la convention avant de conclure.
- scp vers VPS copie en 600 → chmod 644 après déploiement (nginx 403 sinon).
- Validation exercices : toujours vérifier (a) case noire (r+c impair), (b) pas de chevauchement W/B, (c) clé gagnante au bon signe.
