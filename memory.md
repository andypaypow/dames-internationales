# Dames Internationales (bureau_de_travail/dames-international)

## 🎯 Projet
Application web de jeu de dames internationales (10×10, 20 pions, règles FID).

## ✅ État (v6 — 12/09/2026 : Vite+TS + exercices supprimés + nouvelle UX)
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
