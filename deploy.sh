#!/usr/bin/env bash
# Déploiement dames.filtreexpert.org — build statique vers /var/www/dames
set -euo pipefail
cd "$(dirname "$0")"

DEST="/var/www/dames"

if [ ! -d dist ] || [ ! -f dist/index.html ]; then
  echo "❌ dist/ absent — lance 'npm run build' d'abord (ou passe par 'npm run deploy')"
  exit 1
fi

rsync -a --delete dist/ "$DEST/"
chmod -R a+rX "$DEST"
echo "✅ Déployé vers $DEST ($(find "$DEST" -type f | wc -l) fichiers)"
echo "   → https://dames.filtreexpert.org/ (penser Ctrl+Shift+R si cache Cloudflare)"
