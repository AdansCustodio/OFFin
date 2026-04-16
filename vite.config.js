import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Mapeamos cada página HTML para que o Vite as processe no build final
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
        termos: resolve(__dirname, 'termos.html'),
        privacidade: resolve(__dirname, 'privacidade.html'),
        regras: resolve(__dirname, 'regras.html')
      }
    }
  }
})
