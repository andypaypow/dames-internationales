import { defineConfig } from 'vite';

export default defineConfig({
  // Hash des assets => cache-busting automatique derrière Cloudflare
  build: {
    target: 'es2022',
    assetsInlineLimit: 0
  }
});
