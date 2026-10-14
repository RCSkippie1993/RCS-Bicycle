import { defineConfig } from 'vite';

// Relative asset paths support both a domain root and GitHub Pages project URLs.
export default defineConfig({ base: './', build: { rollupOptions: { input: {
 home: new URL('./index.html', import.meta.url).pathname,
 collection: new URL('./collection.html', import.meta.url).pathname,
} } } });
