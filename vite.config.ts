import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// Vendor groups split by change frequency so app edits keep a warm browser cache.
// `motion` is intentionally left to Rollup: grouping it would fold the lazily
// imported gesture/projection features into the initial download.
const VENDOR_CHUNKS: ReadonlyArray<readonly [string, RegExp]> = [
  ['react-vendor', /node_modules\/(?:react|react-dom|scheduler)\//],
  ['data-vendor', /node_modules\/@supabase\//],
  ['date-vendor', /node_modules\/(?:date-fns|@date-fns)\//],
  ['ui-vendor', /node_modules\/(?:lucide-react|clsx|tailwind-merge)\//],
];

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
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          for (const [name, pattern] of VENDOR_CHUNKS) {
            if (pattern.test(id)) return name;
          }
          return undefined;
        },
      },
    },
  },
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
