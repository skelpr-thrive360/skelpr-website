import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Prerender build: `src/entry-server.tsx` → `dist-ssr/entry-server.js`, which
 * `scripts/prerender.mjs` reads. A second config because the main one is built
 * around two HTML pages and this build has none. The output is read by Node,
 * never served: one ESM file, no copied `public/`.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    // Already in .gitignore; no reason to duplicate public/ beside it.
    copyPublicDir: false,
    // Unminified: a prerender failure should point at a line, not a column.
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: 'entry-server.js',
        // The package is `"type": "module"`, so this `.js` is read as ESM by Node.
        format: 'esm',
      },
    },
  },
})
