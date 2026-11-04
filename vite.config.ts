import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:demo` arma la demo en un solo HTML (JS, CSS y fuentes
// adentro) para mostrarla como página suelta, sin servidor ni Firebase.
const demo = process.env.VITE_DEMO === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: !demo }),
    react(),
    tailwindcss(),
    ...(demo ? [viteSingleFile()] : []),
  ],
  build: demo ? { outDir: 'dist-demo' } : undefined,
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
