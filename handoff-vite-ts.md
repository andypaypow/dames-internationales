# Handoff — Vite+TS + refonte UX (dames.filtreexpert.org)

## 🎯 Problème
1. Exercices/solutions à supprimer (demande utilisateur).
2. Sélection : coup unique doit se jouer direct ; rafle jouable en cliquant
   pion puis destination FINALE ; possibilité d'annuler une sélection/action.

## 🔧 v6 — Changements (12/09/2026)
- **Exercices supprimés** : `src/exercices.ts` supprimé, section UI « 🎓 Mode Exercice »
  retirée de index.html, logique exo/hint/solution retirée d'app.ts.
- **Nouvelle sélection** (`selected: [r,c]`) remplace `mustFrom` :
  - pion avec 1 seule possibilité → coup joué immédiatement ;
  - pion multi-choix → destinations FINALES marquées (case d'arrivée de chaque
    séquence) ; clic sur l'une = rafle entière jouée en un clic ;
  - re-clic sur le pion, clic ailleurs, Échap ou clic droit → déselection ;
  - « ↩ Annuler le coup » (undo) conservé pour revenir en arrière.
- Si 2 séquences différentes finissent sur la même case (rare), la 1re est jouée.

## 🔧 v5 — Migration Vite+TS (rappel)
- Repo Vite+TS strict : src/{regles,ia,app}.ts, 13 tests Vitest, deploy.sh (rsync dist→/var/www/dames).
- **Bug latent v1 corrigé** : applyMove sur capture → `{...null}` = `{}` (pièce fantôme). Fix : relire la pièce à l'arrivée.
- nginx : `X-Content-Type-Options: nosniff` ajouté. Backup v1 : `/var/www/dames/index.html.v1.bak` + `app/index.html`.

## ✅ Tests
- vitest 13/13 ✓ · tsc strict ✓ · build 7,3 Ko JS (3,2 Ko gzip) · déployé, hash `index-Be7OVNxA.js` live.
- ⚠️ Test manuel utilisateur : coup unique auto, rafle en 2 clics, Échap/clic droit, undo.

## 📋 Reste à faire
- [ ] Validation utilisateur puis commit git (fichiers déjà stagés)
- [ ] Supprimer backups `index.html.v1.bak` + `app/index.html` après validation
- [ ] Exercices : à recréer plus tard si souhaité (pattern exercices.ts documenté dans memory v4)

## 🔁 Commandes
```bash
cd bureau_de_travail/dames-international
npm run dev · npm test · npm run deploy   # dev · règles · build+rsync
```
Rollback : `cp /var/www/dames/index.html.v1.bak /var/www/dames/index.html`
