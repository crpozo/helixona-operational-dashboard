import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El `base` solo aplica en build (GitHub Pages sirve el sitio bajo
// /<nombre-del-repo>/). En dev se queda en '/' para no romper el server local.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/helixona-operational-dashboard/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}))
