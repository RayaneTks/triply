import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const laravelTarget = env.LARAVEL_API_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // Si vous lancez `vite` seul (sans server.ts), les appels /api/* sont relayés vers Laravel.
      proxy: {
        '/api': {
          target: laravelTarget,
          changeOrigin: true,
        },
      },
      watch: {
        // Volumes Docker / fichiers de config non-source — éviter ENOTSUP sur certaines plateformes.
        ignored: [
          '**/backend/**',
          '**/pgadmin/**',
          '**/dist/**',
          '**/node_modules/**',
          '**/frontend/triplydev/**',
        ],
      },
    },
  };
});
