import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// GitHub Pages serves project sites under /<repo>/ (e.g. /niulai-run/).
// Use the repo subpath as base ONLY in CI so the published bundle resolves
// assets correctly; local dev keeps the root base (http://localhost:5173).
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/niulai-run/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
