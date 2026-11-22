import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Use 'dist' when deployed on Vercel or when mode is 'vercel'.
  // Otherwise default to '../backend/web' for local Flask static serving.
  const isVercel = Boolean(process.env.VERCEL) || mode === 'vercel';
  const outDir = process.env.BUILD_OUT_DIR || (isVercel ? 'dist' : '../backend/web');

  return {
    plugins: [react()],
    build: {
      outDir,
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
