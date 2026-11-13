import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Version de l'app (package.json), affichee en pied de page.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Relais de l'API sous /api, vers le backend de la machine : avec
// VITE_API_BASE_URL=/api/v1, l'app et l'API passent par le meme port.
// Indispensable pour tester via un tunnel (VS Code port forwarding, ngrok)
// ou depuis un telephone du reseau local, ou "localhost:8080" designerait
// l'appareil du testeur. L'en-tete Origin est retire : pour le navigateur la
// requete est "meme origine", et sans ca le backend refuserait l'adresse du
// tunnel (CORS) ; l'API s'authentifie par jeton, pas par cookie.
const relaisApi = {
  '/api': {
    target: process.env.API_UPSTREAM || 'http://localhost:8080',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (requete) => requete.removeHeader('origin'))
    },
  },
}

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { port: 5174, proxy: relaisApi },
  // vite preview (build servi tel quel, rapide a travers un tunnel) : meme relais.
  preview: { port: 5174, proxy: relaisApi },
})
