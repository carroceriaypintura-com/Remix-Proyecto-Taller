import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Cache the large SDKs separately without hiding bundle-size warnings.
          groups: [
            { name: 'firebase-firestore', test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/ },
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  
  server: {
    port: 3000,
    allowedHosts: true as const,
    
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify - file watching is disabled to prevent flickering
    hmr: process.env.DISABLE_HMR !== 'true',
    
    // Disable file watching when DISABLE_HMR is true to save CPU
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
