import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/features/admin/')) return 'admin';
            if (id.includes('/newsletter/') || id.includes('newsletter-pdf')) return 'newsletter-pdf';
            return undefined;
          }
          if (id.includes('react-dom') || id.includes('react-router') || /[/\\]react[/\\]/.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('qrcode.react')) return 'vendor-qr';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
