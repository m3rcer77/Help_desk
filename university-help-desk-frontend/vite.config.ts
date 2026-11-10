import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В режиме разработки запросы /api уходят на локальный бэкенд (порт 5000).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
