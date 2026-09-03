import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@rewind/webmcp': fileURLToPath(new URL('./packages/rewind-sdk/src/index.ts', import.meta.url)),
        },
    },
    build: {
        rollupOptions: {
            input: {
                home: `${root}index.html`,
                catalog: `${root}examples/catalog/index.html`,
            },
        },
    },
});
