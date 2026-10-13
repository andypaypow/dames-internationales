# Handoff — Trait Blancs + fin de solution + favoris (v19)

## 🎯 Problème (demande user)
1. Les Blancs doivent débuter TOUTES les parties/exercices.
2. Le jeu ne doit pas se bloquer à la fin de la solution d'un exercice.
3. Pouvoir mettre des exercices en favoris.

## 🔧 Correction (src/app.ts, index.html, src/style.css)
- `exoReset` : `turn = 'w'` FORCÉ (avant : `e.trait ?? 'w'`) ; A.98/A.100
  (solution commençant par un coup Noir) → coup blanc d'ouverture libre +
  message dédié dans `exoJudge` (step 0, trait 'b').
- `init()` (modes pvp/ia) : `turn = 'w'` (« Les Blancs commencent ») ; règles
  HTML corrigées ; branche undo début de partie corrigée.
- `exoSuccess` : ne vide plus `sequences` → `playableMoves()` = jeu libre
  après la réussite, message « ⏮ Départ / 📚 autre exercice ». Plus de gel.
- Favoris : `localStorage['dames-favoris']` (ids) ; étoile par item du menu
  (clic étoile = bascule sans charger l'exercice), groupe « Favoris » en tête
  du menu, bouton etoile a côté du titre du panneau.

## ✅ Tests
- tsc OK, build OK (bundle index-BZ4pbYiz.js), 95/95 tests vitest.
- Déployé sur /var/www/dames — https://dames.filtreexpert.org (vérifié live).

## 📋 Reste à faire
- [ ] Validation user (trait, déblocage, favoris) → supprimer ce handoff,
      reporter le résultat dans memory.md.
