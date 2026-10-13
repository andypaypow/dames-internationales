# Handoff — 🖼 Comparaison image du livre + validation conformité

## 🔧 v21 — suivi serveur, remarques résolues, C31 complété
- **Cron** `*/10 * * * * /opt/dames-ctrl/surveille.sh` : détecte validations (ok≥1,
  image masquée, journalisées) et nouvelles remarques → append à
  `exo-remarques-a-traiter.md` (état vu : /var/www/dames-ctrl/.vu).
- **Bande déroulante rouge** : le serveur expose `_resolus` dans /exo-ctrl/ ;
  l'app affiche « ✅ Remarque résolue » en défilement rouge (vu : localStorage
  dames-resolus-vus), bouton ✕.
- **Remarques résolues (v21)** : AUT.161/162 supprimés (cours, pas exercices) ;
  34.1 = dame confirmée (solution livre 1-29/29-42 longue portée, diagramme sans
  couronne — note ajoutée) ; C31.2 corrigé (49 pas 50, ligne complète) ;
  C31.3/31.7/31.8 ajoutés + validés moteur (7/7). **C31.6 : pas de diagramme dans
  le PDF** (libellé orphelin) → impossible à implémenter.
- 63/63 tests. En ligne bundle index-Df3ze0gW.js.

## 🎯 Problème
Sur https://dames.filtreexpert.org, l'utilisateur veut, quand il choisit un exercice,
voir à côté l'image issue de l'extraction du PDF source (diagramme du livre) pour
comparer avec le plateau et le corrigé.

## 🔧 Solution implémentée (v19)
- `public/exo-img/*.jpg` : rendu JPEG compressé des pages sources (mapping id → page
  dans `src/exo-img.ts`, généré).
- `index.html` : panneau `#exoImgBox` dans `#exoPanel` (image + ✓ Conforme + ✍ Remarque + 📋),
  dialogs `#exoRemark` (saisie), `#exoZoom` (agrandissement), `#exoRemarkList` (toutes les remarques).
- `src/app.ts` : état par exercice en localStorage `dames-exo-ctrl` = `{ [id]: {ok, remarks[]} }`.
  - ✓ Conforme : incrémente `ok` ; à **2 validations** → l'image ne s'affiche plus pour cet exercice.
  - ✍ Remarque : dialog texte, stockée → badge 🚩 sur le panneau, liste/copie via 📋
    (`navigator.clipboard`, JSON `{id: [remarques]}`) pour corrections ultérieures.
  - Panneau affiché seulement si l'exo a une image ET `ok < 2` ; refresh via `exoUpdateImg()` dans `exoReset()`.

## ✅ Tests
- `tsc --noEmit` OK · 95/95 tests · build OK · déployé (bundle index-BkovGIgr.js).
- Vérifié en ligne : `/exo-img/*.jpg` → 200, mapping = fichiers (MAP_OK).
- Pages confirmées visuellement par le sous-agent (labels 33.x, 34.x… sous les diagrammes).

## 🔧 v19b — suivi serveur + premier thème
- Service `dames-ctrl` (systemd, /opt/dames-ctrl/server.py, 127.0.0.1:8096) :
  POST `/exo-ctrl/` {id, ok, remarks} → fusion dans `/var/www/dames-ctrl/exo-ctrl.json`
  (fichier lu par le Correcteur — c'est LÀ que je vois les validations/remarques).
- nginx `/exo-ctrl/` → proxy 8096 (vhost dames-filtreexpert).
- app : chaque ✓/✍ est envoyé au serveur (fetch POST) ; au chargement, GET fusionne
  (ok max, remarks) → fonctionne après vidage de cache / autre appareil.
- Démarrage de l'app sur le 1ᵉʳ exercice avec image (C30.1, thème aile30).
- Test e2e OK (POST + GET via https), données de test supprimées.

## 📋 Reste à faire
- [x] Build + tests + deploy VPS
- [ ] Validation utilisateur thème par thème (C30 d'abord) ; corriger les exercices signalés
      — les remarques arrivent dans `/var/www/dames-ctrl/exo-ctrl.json`
- [ ] Après validation : supprimer ce handoff, reporter dans memory.md
