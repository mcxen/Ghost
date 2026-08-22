import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import {defineConfig, esmExternalRequirePlugin} from 'vite';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Standalone build for the read-only HTML renderer entry. Produces a single
// ESM chunk dist/renderer.js that bundles LexicalHTMLRenderer + DEFAULT_NODES
// + @lexical/headless, but NOT the editor React components/plugins. jsdom is
// externalized (browser callers pass their own document, so the jsdom path is
// never reached).
export default defineConfig({
    plugins: [
        svgr(),
        react(),
        esmExternalRequirePlugin({
            external: [/^react($|\/)/, /^react-dom($|\/)/],
            skipDuplicateCheck: true
        })
    ],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    },
    resolve: {
        alias: {
            // Resolve the sibling workspace package from source without
            // running a full monorepo install (apps/admin breaks `pnpm i`).
            '@tryghost/kg-lexical-html-renderer': resolve(__dirname, '../kg-lexical-html-renderer/src/index.ts')
        }
    },
    build: {
        minify: true,
        sourcemap: true,
        // Don't wipe dist/ — the main build already wrote koenig-lexical.js +
        // style.css there. This entry only adds dist/renderer.js.
        emptyOutDir: false,
        lib: {
            entry: resolve(__dirname, 'src/renderer.ts'),
            name: 'KoenigRenderer',
            fileName: () => 'renderer.js',
            formats: ['es']
        },
        rolldownOptions: {
            external: ['jsdom', /^react($|\/)/, /^react-dom($|\/)/],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM'
                }
            }
        }
    }
});
