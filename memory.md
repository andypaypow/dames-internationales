# Dames Internationales (bureau_de_travail/dames-international)

## 🎯 Projet
Application web de dames internationales (10×10, 20 pions, règles FID).
Repo Vite+TS : `src/{regles,ia,app,exercices,exos-gen,exo-img}.ts` · `npm run dev/test/deploy`.

## 📚 Sources PDF archivées (docs/)
- `docs/24775-cours-de-jeu.pdf` — Cours de jeu (Toulouse) : C21.x, C30.x, C31.x.
- `docs/24801.pdf` — Fins de parties : 33.x, 34.x, 38.x, 39.x, 40.x.
- `docs/enchainements-gregoire-pesente-ffjd.pdf` — enchaînements, diag 161-162.
- `docs/fmjd-cours1-fr.pdf` — **FMJD Cours 1 (fr)** : Leçons 1-11 (ricochet p.23-25,
  solutions p.36-37). ⚠️ /tmp volatile : repartir de ces copies (pipeline : render <pdf>).
- 🧰 **Skill `/exercices-dames`** : pipeline complet d'ajout d'exercices
  (render → lecture diagrammes → check → merge → deploy) — à utiliser pour tout ajout.

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
  aiAnalyse prof 9. Taux de « l'IA trouve le coup du livre » : ricochet 8/8, bombe 4/8,
  Napoléon 2/8, arche 4/8, dame15 6/16 — les 1ers coups sacrifices/préparatifs sont
  vus comme pertes à courte vue ; le 📖 livre (buildBook) les couvre en partie.
- Reste à faire (demande utilisateur) : TOUS les autres exercices corrigés du document
  (Leçons 1-5 C1-C5, 18-20, 21 coups de dame, 22, 23 formations + Exercices 23.x,
  25 blocage, 26+ ; C28.x marchand de bois…). Solutions disséminées p.36-38, 80-86,
  123+ ; diagrammes dans les leçons.

## ✅ État (v23 — ↔️ Coup du ricochet FMJD + 📖 livre d'exercices)
- **v23a exercices** : +8 exos « ↔️ Coup du ricochet » (FMJD Cours 1, Leçon 7,
  diagrammes p.25, solutions p.36-37) → thème `exercices-wip/ricochet07/`.
  Transcription des pièces AUTO (détection pixels : grille = lignes sombres,
  fenêtre centre 28×28, disque noir dark>0.70 / blanc bright>0.75) puis relecture
  visuelle de contrôle. 8/8 validés moteur (exo-theme check).
  C7.2 fin garbelée reconstruite (28x26 = 28-17x26) ; C7.6 rafles noires
  développées (16x27x38, 8x13x24x30, 34x25x14x3). Image : `public/exo-img/fmjd1-25.jpg`.
- **v23b test IA** : `scripts/test-ricochet.ts` — pour chaque exo : bilan matériel
  de la ligne + l'IA (miroir 180° couleurs inversées → aiAnalyse prof 9/4 s)
  trouve-t-elle le 1ᵉʳ coup du livre → **8/8**.
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
- **v14** : 📚 menu exercices + 💡 indice ; swipe ; `[hidden]{display:none!important}`.
- **v7-v13** : mode exercice (24775 ch.21, C30/C31, 33.x/34.x avec dames bd/wd) ;
  pipeline `scripts/exo-theme.ts` (render/init/show/check/merge/deploy).
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
