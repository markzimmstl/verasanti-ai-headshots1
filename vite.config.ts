import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // CRITICAL: Force all React imports to resolve to the local instance.
    // This prevents "Dual React" crashes when the environment injects an importmap.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Ensure these are pre-bundled so Vite controls their loading
    include: ['react', 'react-dom', 'lucide-react', '@google/genai'],
  },
  define: {
    // Safely inject the API key
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Prevent crashes when libraries access global process
    'process.env': {},
  },
  server: {
    host: '0.0.0.0',
  }
});