
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', // Ensures assets load correctly on any path
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    define: {
      // Robustly polyfill process.env to prevent "process is not defined" crashes
      'process.env': JSON.stringify(env),
      // Specifically ensure API_KEY is available if defined in .env
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
          output: {
              manualChunks: {
                  vendor: ['react', 'react-dom'],
                  pdf: ['pdf-lib'],
                  ai: ['@google/genai']
              }
          }
      }
    }
  };
});
