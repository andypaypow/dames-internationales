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
