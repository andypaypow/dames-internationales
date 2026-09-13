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

## ✅ État (v17 — ⚔️ Tactique fins de parties, 24801 ch.39)
- **v17** : +6 exos « ⚔️ Tactique fins de parties » (24801 p.47-48, sol p.55) :
  39.1 (dame 34), 39.2 (dame 2), 39.3 (dames 6b/35), 39.4 (dames 3/32 + dame 26b),
  39.6 (dame 49), 39.8 (dames 19/40b). **39.5 écarté** (solution livre incohérente,
  pas de gain forcé démontré) ; 39.7 sans diagramme. Thème exercices-wip/tactique39/.
- Leçons v17 (→ skill /exercices-dames) : en ch.39 le « x » du livre est souvent un
  coup CALME (49x16, 19x2, 25x34, 50x17 rejoués sans prise) ; rafle majoritaire
  forcée → ligne livre tronquée (39.4 : 26x29x15) ; variante alternative retenue
  quand la branche principale est illégale (39.3 : 21x23 au lieu de 21x5).
- En ligne (bundle index-BoQ8gAg3.js, 89/89 tests).

## ✅ État (v18 — 🎯 Fins de parties pratiques, 24801 ch.40 — PDF 24801 terminé)
- **v18** : +6 exos « 🎯 Fins de parties pratiques » (24801 p.52, sol p.55) :
  40.1-40.6 (parties réelles : Tsjizjow-Ba, Dibman-Presman…). **40.7/40.8 écartés**
  (pas de solution imprimée, pas de gain forcé net au moteur). Thème exercices-wip/pratique40/.
- Leçon v18 : le « 1x41 + » du livre (40.2) injouable depuis le diagramme (coquille
  probable) → tronqué ; ⚠️ l'analyse DOIT trier les chemins comme `check`
  (rafle majoritaire la plus courte) sinon replay divergent = conclusions fausses.
- En ligne (bundle index-B5zEH_Tr.js, 95/95 tests).

## 📜 États v7-v15 (condensé — détails dans git log et skill /exercices-dames)
- **v15** (commit 8cd1341) : fix gel exercices (exoSchedule désync, jetons playGen/exoRun
  contre reset pendant rafle) · ▶ Solution auto · vitesse 0,25×-5× · 🔁 Repeat · E2E OK.
- **v14** : boutons flottants 📚 (menu arborescent) + 💡 (indice) ; swipe damier ;
  `[hidden]{display:none!important}`. ⚠️ bouton HTML retiré sans son handler = JS cassé.
- **v13/v12/v11/v10** : +16 exos 24801 (33.x/34.x, DAMES bd/wd) ; +4 C31.x ; +8 C30.x ;
  +2 AUT.161/162.
- **v9c pipeline** : `scripts/exo-theme.ts` (render/init/show/check/merge/deploy).
- **v9/v9b** : +10 exos FFJD ; Exo.goal 'gain' + Exo.trait ; réponse adverse AUTO.
- **v7/v8/v6** : mode exercice 24775 ch.21 ; numérotation 1-50 ; Vite+TS strict.
- Repo Vite+TS : `src/{regles,ia,app,exercices,exos-gen}.ts` · `npm run dev/test/deploy` (build hashé).
- Sélection exo : coup unique = direct ; multi = destinations FINALES, clic = rafle entière.
- Fix v1 : pièce fantôme (`nb[end] ?? nb[from]`) ; `init()` doit calculer `sequences` ;
  rafle animée playMove async, flag `animating` ; IA passe par playMove.


## 📜 Historique v1-v4 (condensé)
- Règles FID : prise obligatoire + majoritaire (récursif), pions avant/arrière, dames
  volantes, promotion si arrêt dernière rangée, Noirs commencent. IA minimax α-β 3 niveaux
  · 2 joueurs · Undo · fin de partie · inversion damier 🔄.
- v3/v4 : exercices « coup du talon » + PDF Doubovy (supprimés en v6). Cases 1-50 →
  (r,c) : r=(n-1)/5 ; r pair c=2k+1, impair c=2k.

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
