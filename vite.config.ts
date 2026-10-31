import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'flyer-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const [key, value] of Object.entries(env)) process.env[key] ??= value;
      server.middlewares.use('/api/flyer-data', async (req, res, next) => {
        try {
          const { default: handler } = await import('./api/flyer-data.mjs');
          await handler(req, res);
        } catch (error) { next(error); }
      });
    },
  }],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    host: '127.0.0.1',
  },
});
