import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Inserta una Content-Security-Policy solo en el build de producción
// (en desarrollo, Vite necesita scripts en línea para el recargado en caliente).
function politicaCsp(urlApi: string): Plugin {
  return {
    name: 'insertar-csp',
    apply: 'build',
    transformIndexHtml() {
      const origenApi = new URL(urlApi).origin
      const contenido = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self' ${origenApi}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: contenido },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const urlApi = env.VITE_API_URL || 'http://localhost:5237'
  return {
    plugins: [react(), politicaCsp(urlApi)],
    server: { port: 5173, strictPort: true },
    preview: { port: 5173, strictPort: true },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      env: { VITE_API_URL: 'http://localhost:5237' },
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
