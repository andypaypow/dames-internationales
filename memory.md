# Dames Internationales (bureau_de_travail/dames-international)

## 🎯 Projet
Application web de jeu de dames internationales (10×10, 20 pions, règles FID).

## 📚 Sources PDF archivées (docs/)
- `docs/24775-cours-de-jeu.pdf` (4,7 Mo) — Cours de jeu (jeudedames.toulouse),
  ex. C21.x, C30.x aile droite (p.58-59, sol p.68), C31.x autres enfermés
  (p.64, sol p.69). Texte : pdftotext p.2 = sommaire.
- `docs/enchainements-gregoire-pesente-ffjd.pdf` (0,9 Mo) — « Les enchaînements »,
  marchand de bois p.6+, aile droite p.57+, diag 161-162 p.99-100.
  ⚠️ /tmp est volatile : repartir de ces copies (pipeline : render <pdf> …).

## ✅ État (v14 — 📚💡 boutons flottants + gestes mobile, UI exercices)
- **v14** (validé utilisateur) : UI exercices revue pour mobile/desktop :
  - Menu exercices = **bouton flottant 📚 (bas gauche), toujours visible** dès
    l'ouverture ; tap → dropdown arborescent (thèmes dépliables ▸/▾, compteur,
    pastilles exos M/G/C, exo courant surligné, état dans `exoOpenCats`).
    Choisir un exo hors mode 🎓 bascule le mode auto (`dispatchEvent('change')`).
  - 💡 = **bouton flottant déplaçable (bas droite)**, mode exo seulement ; tap =
    révèle le coup suivant dans une bulle au-dessus (`exoFabTxt`, pointer
    capture, drag si >6px) ; bouton Indice retiré de la nav exercices.
  - **Gestes** : swipe horizontal sur le damier (← revenir, → rétablir,
    seuil 50px, ratio 1.6) ; PC : double-clic coin gauche <18% / droit >82%.
  - CSS : `[hidden]{display:none!important}` (le display:flex des cartes
    écrasait l'attribut hidden) ; options select stylées fond sombre.
- ⚠️ **Leçon v14** : retirer un bouton du HTML sans retirer son handler
  `$().onclick` casse TOUT le JS au chargement (damier + menu vides).
  Diagnostic : Chrome headless `--dump-dom` + `--enable-logging=stderr`
  (compter "Uncaught", vérifier 100 `.sq` / 40 `.piece`).
- En ligne (bundle index-Cor0kPP0.js, 77/77 tests).

## ✅ État (v13 — ⚖️ Opposition + 👑 Dame contre pions, PDF 24801)
- **v13** : +16 exos depuis `docs/24801.pdf` (Fins de parties, jeudedames.toulouse) :
  33.1-33.8 « L'opposition » (p.11, sol p.53) + 34.1-34.8 « Dame contre pions »
  (p.18, sol p.53). Thèmes persistants exercices-wip/{opposition33,damepions34}/.
- **Support DAMES ajouté** : Exo.bd/wd (cases des dames au départ) dans
  exercices.ts/app.ts/exo-theme.ts (build, check, merge) + tests buildExo.
- Transcription auto : détection pièces par pixels (crops 300 dpi, mapping
  case = 5r+(c+1)/2 si r pair, 5r+c/2+1 si r impair ; pièces sur cases grises
  foncées du diagramme), croisée avec les solutions texte du livre.
- ⚠️ Solutions du livre fautives : 34.1 « 7-1 » illégal (prise par la dame
  forcée après 19-23 → 7x29 ; suite reconstruite 15-20 29x15) ; 34.7 « 9-3 »
  impossible (dame en 8) et suite « 20x38 » garbelée (tronquée à 14-20).
- En ligne (bundle index-kui_6I23.js, 77/77 tests).

## ✅ État (v12 — 🔒 Autres enfermés 24775 ch.31)
- **v12** : +4 exos C31.1, C31.2, C31.4, C31.5 (validés moteur). C31.2 tronqué à
  la rafle 22x33x44. ⚠️ C31.3/31.6/31.7/31.8 écartés : transcriptions douteuses
  (solutions du livre parfois fautives/garbelles, ex « 22x44 » correct mais
  « 43-39 » = « 50-39 ») — à refaire en crop 400 dpi si demandé.

## ✅ État (v11 — les 8 exercices PDF 24775 « aile droite »)
- **v11** : +8 exos C30.1→C30.8 (24775.pdf p.58-59, solutions p.68) via pipeline :
  positions lues en crop 300 dpi (pdftoppm -x -y), solutions du livre, validées
  moteur. `check` accepte maintenant la notation ABRÉGÉE du livre (token =
  sous-séquence, arrivée finale égale, rafle majoritaire la plus courte retenue).
  En ligne + thème persistant exercices-wip/aile30/.

## ✅ État (v10 — catégorie 🔒 Autres enchaînements)
- **v10** : +2 exos (chapitre conclusion, diag 161-162) via le pipeline exo-theme :
  AUT.161 pions arrière aile gauche (30-24! 19x30 35x24) · AUT.162 trèfle
  (34-30! ; 25-30-35 bloquent 5,14,15,19,20,24). Thème persistant dans
  exercices-wip/autres/ (exos.json + .valide, re-fusionné à chaque merge).
  ⚠️ diag 162 : 30 blanc ABSENT au départ (formé par 34-30) ; noir 22/162 et
  placement 28/162b à ne pas inventer (captures forcées parasites).
- **v9c pipeline** : `scripts/exo-theme.ts` (vite-node) = ajout semi-auto de thèmes :
  `render pdf p1 pN <th>` (PNG) · `init <th> <cat> <goal>` · `show <th> n`
  (coups légaux du trait) · `check <th>` (moteur → .valide, chemins majoritaires)
  · `merge <th>` (régénère src/exos-gen.ts + branche EXOS_THEMES dans
  exercices.ts + tsc/tests) · `deploy`. Workflow : render → lire images →
  remplir exercices-wip/<th>/exos.json → check → merge → deploy.
- **v9** (12/09) : +10 exercices depuis « Les enchaînements » (Grégoire/Pesente, FFJD,
  ffjd.fr/fichiers/livres/Les_enchainements.pdf) :
  🪵 Marchand de bois M.8,M.9,M.13,M.15,M.15b,M.17 (prise, mazette, pionnage,
  dégagements, sortie subtile) · ➡️ Aile droite A.97,A.98,A.100,A.101.
  Méthode : pdftoppm → lecture visuelle + positions de débuts reconstruites
  coup par coup, TOUT validé moteur via `scripts/valide-enchainements.ts`
  (vite-node, mapper coups livre → chemins réels prise majoritaire).
  ⚠️ Pièges : blanc 46 vide si 46-41 joué ; noir 19 absent du diag 17
  (sinon 19x28 forcé) ; (25x23) du livre = rafle 25x34x23 au moteur.
- **v9b UX** : `Exo.goal` + 'gain' (menu G, statuts adaptés) + `Exo.trait`
  ('b'|'w', défaut 'w') ; l'adversaire répond AUTO avec le demi-coup suivant
  de la solution tant qu'on la suit (flag `exoAutoMove`, sinon jeu libre).
- **v8** (12/09 : menu exercices + numérotation internationale 1-50 partout, voir handoff v4)
- **v7** : mode exercice réintégré depuis PDF 24775 (jeudedames.toulouse, ch.21) :
  `src/exercices.ts` (15 exos, chemins de rafle exacts, validés moteur) + mode `exo`
  dans app.ts + `tests/exercices.test.ts`. Voir handoff-exercices-coups-de-dame.md.
  ⚠️ PDF défectueux : C21.13 = doublon du 21.12 (non reproduit) ; le diagramme
  « C 21.13 » est en réalité la position du C 21.14 ; fins de 21.5 et 21.12 recalculées.
  Convention : case 1 = foncée en haut à gauche (Noirs 1-20 haut, Blancs 31-50 bas).
- **v6** (12/09/2026 : Vite+TS + exercices supprimés + nouvelle UX)
- Repo Vite + TS strict : `src/{regles,ia,app}.ts` + `style.css`, `tests/regles.test.ts` (13 ✓), `deploy.sh`, `vite.config.ts`.
- Commandes : `npm run dev` · `npm test` · `npm run deploy`.
- **Exercices/solutions supprimés** (src/exercices.ts + UI) — pattern dans l'historique/memory v4 si recréation.
- **Nouvelle sélection** : coup unique = joué direct ; multi-choix = destinations FINALES marquées, clic = rafle entière ; déselection par re-clic/clic ailleurs/Échap/clic droit ; undo conservé.
- **Bug latent v1 corrigé** : applyMove sur capture → `{...null}` = `{}` (pièce fantôme). Fix : `nb[end] ?? nb[from]`.
- **Bug mode 2 joueurs corrigé (Noirs immobiles au 1er coup)** : `init()` ne calculait pas `sequences = playableMoves(...)` → aucun pion noir jouable en 2 joueurs (invisible en mode IA car `aiMove()` joue direct). Fix dans `src/app.ts:init()`.
- **Rafle animée pion après pion** : `playMove` async — pour une capture, la pièce saute case par case (clone du plateau `work` rendu à chaque étape) et chaque pion sauté fond (classe `.piece.taken` → opacity/scale) avant le saut suivant ; applyMove(b0, m) final (promotion uniquement à l'arrêt). Flag `animating` bloque clics/undo. IA passe aussi par `playMove`.
- **Surbrillance des pions déplaçables supprimée** (`.movable` + `showMovable()` retirés) — reste : `.sel` (pion sélectionné) + `.move`/`.capt-land` (cases d'arrivée).
- Build hashé = cache-busting CF auto. nginx nosniff. **Validé + commités** : `fd2bafd` (v2) + `eeac081` (cleanup — handoff et backups v1 supprimés).

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

## 🎓 Mode Exercice (v4 — PDF + inversion damier)
- **PDF trouvé** : N.Doubovy, « Coups basiques » (2022) — testjeudedames.free.fr/Doubovy/Coups%20basiques%20-%20Livret%20-%202022-01-01.pdf (198 p., répertoire ~100 coups thématisés). Ch. 68 « Le coup du talon » p.77.
- Méthode : pdfimages -png sur les pages → lecture VISUELLE des diagrammes → transcription en cases → validation moteur. (pdftotext inutile : diagrammes = images ; lignes « 371, 28, 4+ » = notation compressée ambiguë.)
- **Exercices PDF** (menu 📄) : pdf1 = diag. I (B:19,23,28,29,35,37,38,42,43 / N:8,9,10,11,13,14,17,26,27 → 37-31, ~+2 pions) ; pdf2 = diag. III (B:18,22,23,28,33,38,39,41,43,47,48,49,50 / N:2,6,11,13,21,27,29,30,31,34,35,36 → 33x24 (+7 ; piège 18x9)). Diag. II = prise forcée 23x12x3 (écarté).
- Autres sources écartées : fichiers Dambo FFJD (tactique-ex1.gz) hors ligne ; PDF Dubois « Fins de parties »/FMJD combinaisons = diagrammes images uniquement ; allonsadame = site mort.
- **Inversion damier** : bouton 🔄 → classe CSS .flip sur #board (rotate 180° du plateau + rotate 180° des .sq pour garder pièces/numéros droits). Dataset inchangé → aucun impact logique.

## 🎓 v3 — menu 5 talons entraînement
- ⚠️ **Convention signes moteur** : search() → +999/+ = les NOIRS gagnent, - = Blancs (evalBoard positif = noir).
- Exercices entraînement (moteur, validés d12, Noirs bloqués) :
  1. 25,28,30,32,40 / 8,13,15,19,23 → 30-24
  2. 11,25,28,30,32,40 / idem → 30-24
  3. 7,25,28,30,32,40 / idem → 30-24
  4. 17,25,28,30,32,40 / idem → 30-24 (ou 17-12)
  5. 25,28,30,32,40 / 7,13,15,19,24 → 25-20
- Transformation Wikipédia→Blancs en bas : rotation 180° + échange couleurs.
- Cases 1-50 → (r,c) : r=floor((n-1)/5) ; r pair : c=2k+1, r impair : c=2k (k=(n-1)%5).

## 🐛 Erreurs & solutions
- **Bug minimax** : `search()` utilisait `-col` sur une string ('w'/'b') → NaN → l'IA jouait quasi au hasard. Fix : `opp=col==='w'?'b':'w'`. Toujours vérifier les types avant d'utiliser un opérateur unaire `-`.
- **Signes search** : + = bon pour les Noirs (evalBoard), +999 = Blancs bloqués. Lire les scores AVEC la convention avant de conclure.
- scp vers VPS copie en 600 → chmod 644 après déploiement (nginx 403 sinon).
- Validation exercices : toujours vérifier (a) case noire (r+c impair), (b) pas de chevauchement W/B, (c) clé gagnante au bon signe.
