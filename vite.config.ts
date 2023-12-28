// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: './src/demo/',
  build: {
    // generate .vite/manifest.json in outDir
    manifest: true,
    rollupOptions: {
      // overwrite default .html entry
      input: 'index.html',
    },
  },
  server: {
    strictPort: true,
    port: process.env.PORT ? +process.env.PORT : 80,
    host: process.env.HOST || 'localhost',
  },
});
