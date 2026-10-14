# Dames Internationales (bureau_de_travail/dames-international)

## 🎯 Projet
Application web de dames internationales (10×10, 20 pions, règles FID).
Repo Vite+TS : `src/{regles,ia,app,exercices,exos-gen,exo-img}.ts` · `npm run dev/test/deploy`.

## 📚 Sources PDF archivées (docs/)
- `docs/24176-cours-partie1.pdf` + `docs/24591-cours-partie2.pdf` (Toulouse, = cours FMJD déjà intégré) · `docs/24775-cours-de-jeu.pdf` (Toulouse) : C21.x, C30.x, C31.x · `docs/24801.pdf`
  (fins de parties) : 33.x, 34.x, 38.x, 39.x, 40.x · `docs/enchainements-gregoire-pesente-ffjd.pdf`.
- `docs/fmjd-cours1-fr.pdf` — **FMJD Cours 1 (fr)**, 168 p. : Leçons 1-30+. Solutions :
  L1-10 p.36-38, L11-20 p.80-82, L21-30 p.123+. Diagrammes dans les leçons.
  ⚠️ /tmp volatile : repartir de ces copies (pipeline : render <pdf>).
- 🧰 **Skill `/exercices-dames`** : pipeline complet d'ajout d'exercices — à utiliser.

## ✅ État (v29 — PDF Toulouse 24801 ch.35/36/37 : +19 exos)
- **v29** : derniers chapitres manquants de `docs/24801.pdf` — 35 (📏 grande diagonale,
  8 exos p.22, sol p.53), 36 (🎲 trictrac, 3 exos sains p.27-28, sol p.54), 37 (🟥
  rectangles, 8 exos p.34, sol p.54) → thèmes `exercices-wip/{diagonale35,trictrac36,
  rectangles37}`. 308/308 tests. Déployé (bundle index-DKNcN-wM.js).
- **PDF Toulouse = cours Goedemoed FMJD** : 24176 (leçons 1-10) et 24591 (11-20) sont
  LA MÊME série que `docs/fmjd-cours1-fr.pdf` déjà intégrée (v23-v28) — mêmes numéros
  C-x.y. Rien à ajouter de ces deux-là (écartés historiques : 16.2-16.8, C11.8, C24.8,
  22.4-22.6). **Les 3 PDF demandés sont donc couverts.**
- Leçons v29 : ⚠️ le merge reprend `cat` des exos.json — si on réécrit exos.json sans
  le champ `cat`, tout part en « 🎯 Thème » → corriger `src/exos-gen.ts` (fait) ou
  garder `cat` dans chaque entrée. Solutions ch.35-37 du livre très abrégées/fausses :
  « 28-23 »→33-28 (35.6), « 35-30 »→34-30 (35.8), « 39x47 »→29-47 (37.4), « 29-1 » de
  37.8 = rafle forcée 29x…x1 ; 37.5/37.6/37.7/37.8 tronqués au coup clé (prise
  majoritaire forcée rend la suite du livre injouable). 36 : 5 écartés (36.1/36.4/
  36.5/36.6/36.8 lignes injouables, vérifiées au moteur), 36.3 réparé (« 7-2 »→« 8-2 »,
  fin → prise forcée 28-19).

## ✅ État (v24 — Leçons 8-17 FMJD : 82 nouveaux exercices)
- **v24** : leçons 8 (bombe), 9 (arche), 10 (Napoléon), 11 (autres coups), 12 (forcing),
  24 (mat/blocage), 13 (repos), 14 (collage), 15 (envoi à dame ×16), 16 (aile),
  17 (sacrifice) — thèmes exercices-wip/{bombe08,arche09,napoleon10,autres11,forcing12,
  blocage24,repos13,collage14,dame15,aile16,sacrifice17}. 160/160 tests.
- **Pipeline éprouvé** : extract_page.py (/tmp, 400dpi) — grilles détectées par lignes
  sombres + pas constant ; ⚠️ arrangement des diagrammes TOUJOURS en colonnes
  (gauche=x.1-4, droite=x.5-8) → crops row-major : label↔crop = {1:1,2:3,3:5,4:7,5:2,6:4,7:6,8:8} ;
  vérifier les étiquettes (planche des bandes labels). Solutions : pdftotext pages
  solutions (L8-10 p.37-38, L11-15 p.80-81, L16-17 p.81, L24 p.123).
- Écartés faute de corrigé/cohérence : C11.8, C24.8, 16.2-16.8 ; tronqués au légal :
  C10.8, C13.6, F12.7, C15.14. « x » du livre = souvent coup calme ; rafles abrégées
  (C14.6 « 47x29 » = 36x47x29).
- Test IA (scripts/test-ricochet.ts <thème>) : miroir 180° couleurs inversées →
  aiAnalyse prof 9. Taux « IA trouve le coup du livre » : ricochet 8/8 … dame15 6/16 —
  les 1ers coups sacrifices sont vus perdants à courte vue ; le 📖 livre les couvre.
- Reste à faire (demande utilisateur) : TOUS les autres exercices corrigés du document
  (Leçons 1-5 C1-C5, 18-20, 21 coups de dame, 22, 23 formations + Exercices 23.x,
  25 blocage, 26+ ; C28.x marchand de bois…). Solutions disséminées p.36-38, 80-86,
  123+ ; diagrammes dans les leçons.

## ✅ État (v25 — Leçons 2-6, 18-20 FMJD : +47 exercices)
- **v25a** : leçons 2 (combinaisons), 3 (Philippe), 4 (mazette), 5 (Royal), 6 (talon)
  → thèmes combi02/philippe03/mazette04/royal05/talon06 (39 exos, p.10-22, sol p.36-37).
  ⚠️ pages 13/19 « hachurées » : crops manuels + **appariement solution↔diagramme
  automatique** (scripts/_match.ts : tester chaque solution sur chaque position) —
  le layout colonne est confirmé mais l'indexation directe crop#n était le bug.
  C5.7 écarté, C3.3 tronqué.
- **v25b** : 18 (forte menace, 16 exos p.70-71), 19 (pions de base, 8 exos p.75 —
  les candidats sont imprimés SOUS les diagrammes), 20 (piéger, 8 exos p.79, sol p.82).
  Menaces (18.1/3/6/8/12, 19.x) : path = coup clé seul. 18.9 (livre 9-13/14 →
  diagramme 8-13), 20.6 tronqué. 231/231 tests.
- **v26** : 21 (coups de dame, 16 exos p.85-86, sol p.122) + 23 (formations,
  6 exos p.94, sol p.123) — appariement moteur systématique. 253/253 tests.
- **v27** : 25 (blocage, 8 exos p.102), 26 (faiblesse, 8 exos p.106), 28 (marchand
  de bois, 8 exos p.114), 29 (enchaînement, 7 exos p.117, C29.5 F écarté) — sol
  p.124, appariement moteur. **284/284 tests.**
- **v28** : 22 (la dame est prise, 5 exos p.90 — 22.4/22.5/22.6 écartés, diagrammes
  non extractibles) ; 289/289 tests.
- **FMJD Cours 1 : couverture terminée.** Non implémentables : L1 (notation),
  L27 (noms d'enchaînements), L30 (= aile30 existant), 22.4-22.6, C11.8, C24.8,
  16.2-16.8 + lignes tronquées notées dans les fiches.

## ✅ État (v23 — ↔️ Coup du ricochet FMJD + 📖 livre d'exercices)
- **v23a exercices** : +8 exos « ↔️ Coup du ricochet » (FMJD Cours 1, Leçon 7,
  diagrammes p.25, solutions p.36-37) → thème `exercices-wip/ricochet07/`.
  Transcription AUTO par détection pixels (détail → v25a/erreurs). 8/8 validés moteur.
  C7.2 fin garbelée reconstruite (28x26 = 28-17x26) ; C7.6 rafles noires
  développées (16x27x38, 8x13x24x30, 34x25x14x3). Image : `public/exo-img/fmjd1-25.jpg`.
- **v23b test IA** : `scripts/test-ricochet.ts <thème>` — bilan matériel + l'IA
  (miroir 180°, prof 9/4 s) retrouve-t-elle le 1ᵉʳ coup du livre → **8/8**.
- **v23c livre** : ia.ts — `buildBook()` : table exacte position→coup construite
  depuis TOUS les exercices validés (EXOS, chaque demi-coup). `aiAnalyse` y
  retrouve une position connue (trait 'b', prof>0) et joue le coup appris
  (`book: true`, score = search prof 4-8, réflexion affiche « 📖 coup de livre »).
  Tests `tests/livre.test.ts` (reconnaissance + pas de faux positif).
- 73/73 tests (exercices 58, règles 13, livre 2).

## ✅ États antérieurs (condensé — détails dans git log)
- **v22** : 💭 panneau `#aiThought` — l'IA rédige sa réflexion (matériel, verdict,
  coup + hésitations, ligne prévue pvLine, menaces). `aiAnalyse` remplace `pickAiMove`.
- **v21** : quiescence prises + éval enrichie + itératif budget temps ; Expert (6/2s),
  Maître (9/4s). **v20** : fix « Noirs jouent 2× à l'init » (init() n'appelle JAMAIS
  aiMove — uniquement nextTurn()).
- **v19** : image PDF par exercice (`exo-img/`, mapping `exo-img.ts`) ; ✓ Conforme ×2
  masque ; ✍ Remarque persistée + serveur `dames-ctrl` (:8096, nginx /exo-ctrl/).
- **v16-v18** : +18 exos 24801 (38.x piège, 39.x tactique, 40.x pratique) ; 39.5/40.7/40.8
  écartés (pas de gain forcé). Leçon : le « x » du livre est souvent un coup CALME ;
  rafles tronquées/coquilles → tronquer au légal ; l'analyse DOIT trier les chemins
  comme `check` (rafle majoritaire la plus courte).
- **v15** : fix gel exercices (jetons playGen/exoRun) · ▶ Solution auto · vitesse · 🔁.
- **v7-v14** : mode exercice (ch.21, C30/C31, 33.x/34.x dames bd/wd), pipeline
  `scripts/exo-theme.ts`, 📚 menu + 💡 indice, swipe, exoSchedule. Détails → git log.
- **v1-v6** : moteur FID (majoritaire, dames volantes), minimax α-β, 2 joueurs, undo.
- Projet GLM/Jev ANNULÉ par l'utilisateur (Maître suffit) — pas de LLM dans le moteur.

## 🌐 Service
- **Repo GitHub : andypaypow/dames-internationales** (branche `master`, commit v22 =
  6f86ab0). Remote sans token ; push via token `/root/my/.env`. Jamais de commit sans validation.
- **URL publique : https://dames.filtreexpert.org** (Cloudflare proxied → nginx :80)
- VPS : `/var/www/dames/` — deploy `rsync -a dist/ vps:/var/www/dames/` + `chmod -R a+rX`
  (scp copie en 600 → nginx 403). Vérif : `curl -s https://dames.filtreexpert.org/ | grep -o 'index-[^"]*\.js'`.

## 🐛 Erreurs & solutions
- **Bug minimax** : `search()` utilisait `-col` sur une string → NaN → IA aléatoire.
  Fix : `opp = col==='w' ? 'b' : 'w'`.
- **Signes search** : + = bon pour les Noirs (evalBoard), ±999 = bloqué. Lire les
  scores AVEC la convention.
- Validation exercices : (a) case noire (r+c impair), (b) pas de chevauchement W/B,
  (c) gain au bon signe ; toute solution de livre se rejoue au moteur avant merge.
- Détection pixels diagrammes : grider sur les LIGNES sombres détectées (pas de bbox
  estimée) ; pion empilé = dame (wd/bd) ; toujours recouper visuellement + solutions.
