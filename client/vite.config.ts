// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/aplicatie-reabilitare/',
  plugins: [react()],
  assetsInclude: ['**/*.wasm', '**/*.tflite', '**/*.binarypb'],
  server: {
    fs: {
      // Permite servirea fișierelor din folderul public
      allow: ['..']
    }
  }
})