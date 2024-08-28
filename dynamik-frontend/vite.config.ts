import { vitePlugin as remix } from '@remix-run/dev'

import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [
        mdx(),
        remix({
            future: {
                v3_fetcherPersist: true,
                v3_relativeSplatPath: true,
                v3_throwAbortReason: true,
            },
        }),
        tsconfigPaths(),
    ],
    build: {
        target: 'ES2022',
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'ES2022'
        }
    }
});
