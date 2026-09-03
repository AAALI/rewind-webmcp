import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: {
        'rewind-sdk': `${root}packages/rewind-sdk/src/index.ts`,
        'rewind-sdk-panel': `${root}packages/rewind-sdk/src/panel.ts`,
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.mjs`,
    },
    outDir: `${root}sdk-dist`,
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
    minify: false,
    sourcemap: true,
  },
});
