// Configuration lue AU DEMARRAGE (et non figee a la compilation) : en
// conteneur Docker, /config.js est genere a chaque lancement depuis les
// variables d'environnement (docker/40-config-runtime.sh). La meme image
// sert donc tous les environnements (demo, preprod, prod).
//
// Ordre de priorite : /config.js (Docker) > variable VITE_* (.env, npm run
// dev / build) > valeur par defaut.
const runtime = (typeof window !== 'undefined' && window.__SENYUMMIES_CONFIG__) || {}

export function configuration(cle, valeurVite, defaut) {
  const v = runtime[cle]
  if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  return valeurVite || defaut
}
