# Handoff — Exercices bloqués (M.9 & autres) + ▶ Solution auto

## 🎯 Problème
- Exercice G M.9 (et d'autres) : blocage en cours d'exercice — plus aucun coup jouable.
- Demande : bouton pour rejouer chaque solution en automatique (vitesse raisonnable),
  jeu libre préservé (jouer ce qu'on veut sans suivre la solution), et si on suit
  l'indice, l'exercice doit dérouler la solution exacte.

## 🔍 Diagnostic
- **Cause 1 (freeze principal)** : dans `exoSchedule()`, branche « Désynchronisé »
  (coup auto de la solution introuvable dans la position courante, ex. après une
  divergence en jeu libre), `exoLock` sautait mais **`sequences` n'était jamais
  recalculé** (restait `[]` après `playMove`) → tout clic = « Ce pion ne peut pas
  bouger » → damier gelé.
- **Cause 2 (course)** : une rafle animée (`playMove` async) continuait de muter
  `board` + rendu après un ⏮ Départ / ↩ pendant l'animation (aucun jeton
  d'annulation) → état corrompu.
- Données saines : simulation moteur de M.9 (7 demi-coups) jouée sans désync.

## 🔧 Correction (src/app.ts, index.html)
- `exoSchedule()` : les 3 sorties du timeout (⏸/changement d'exo/désync) font
  maintenant `exoLock=false` + `sequences=playableMoves()` + re-render → plus de gel.
- Jeton `playGen` : incrémenté dans `playMove`, vérifié après chaque `await` de
  l'animation (abort propre) ; bumpé par `exoReset`, `exoUndo`, `redo`, `init`.
- Jeton `exoRun` : ⏸ Stop invalide la réponse auto programmée SANS recharger l'exo.
- Bouton `#exoSolution` = **▶ Solution auto** : rejoue toute la combinaison
  (reset + auto, délai réglable, rafles animées) ; pendant l'enchaînement il
  devient **⏸ Stop** (rend la main immédiatement, coupe aussi le 🔁).
- **Vitesse réglable** : `#exoSpeed` (🐢 0,5× 1400 ms · ▶ 1× 700 ms · ⚡ 2× 350 ms ·
  🚀 5× 150 ms) lu par `exoDelay()` dans `exoSchedule()`.
- **🔁 Repeat** (`#exoRepeat`, toggle .on) : après chaque réussite, `exoSuccess`
  reprogramme reset + solution auto après 2 s (sécurisé gen/run/repeat) ; ⏸ Stop
  ou re-clic 🔁 désactive.
- `exoJudge` : si plus aucun coup légal → statut explicite « 🚫 Plus aucun coup
  légal… ↩ / ⏮ » au lieu d'un silence.
- Jeu libre conservé : tout coup légal permis (même hors solution) ; si on suit
  l'indice 💡, la solution avance exactement (réponse auto de l'adversaire).

## ✅ Tests
- `npm test` : 77/77 · `tsc --noEmit` · build OK (bundle index-DySiHJSP.js).
- E2E Playwright (jetable, supprimé) sur dist en local : M.9 jusqu'à 🎉 en suivant
  💡 ; jeu libre OK ; ▶ Solution auto OK ; vitesse 🚀 5× = solution complète en
  2,8 s ; 🔁 = 2ᵉ réussite auto observée ; ⏸ Stop casse la boucle ; 0 erreur JS.
- Déployé : https://dames.filtreexpert.org/ (Ctrl+Shift+R si cache CF).

## 📋 Reste à faire
- [ ] Validation utilisateur en ligne.
- [ ] Commit (src/app.ts, index.html, src/style.css stagés) puis reporter dans memory.md et supprimer ce handoff.
