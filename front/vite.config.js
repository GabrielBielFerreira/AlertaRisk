import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  root: ".",
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    strictPort: true,
    port: 3000, 
  }
});