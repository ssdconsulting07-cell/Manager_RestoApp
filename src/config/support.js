import { configuration } from './runtime.js'

// Coordonnees du support, configurables par deploiement (.env) :
//   VITE_SUPPORT_TELEPHONE=+221XXXXXXXXX
//   VITE_SUPPORT_EMAIL=support@exemple.sn
// Valeurs par defaut = coordonnees de DEMONSTRATION, a remplacer par les
// vraies avant la mise en production (memes variables que l'app Client).
// Docker : SUPPORT_TELEPHONE / SUPPORT_EMAIL dans /config.js (config/runtime.js).
export const SUPPORT_TELEPHONE = configuration('SUPPORT_TELEPHONE', import.meta.env.VITE_SUPPORT_TELEPHONE, '+221770000000')
export const SUPPORT_EMAIL = configuration('SUPPORT_EMAIL', import.meta.env.VITE_SUPPORT_EMAIL, 'support@senyummies.sn')

// "+221771234567" -> "+221 77 123 45 67" (numeros senegalais) ; sinon tel quel.
export function telephoneLisible(tel) {
  const m = String(tel).replace(/\s/g, '').match(/^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/)
  return m ? `+221 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : tel
}
