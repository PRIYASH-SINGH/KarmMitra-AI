import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for KarmMitra AI Learner UI
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
