// Fiche marque du restaurant : nom, monogramme ou logo, couleur, etablissement.
//
// Le meme back-office sert plusieurs restaurants : rien de la marque n'est
// ecrit dans les ecrans. Tout vient de la configuration, dans cet ordre :
// /config.js genere au demarrage du conteneur (variables MARQUE_*, voir
// docker/40-config-runtime.sh) > variables VITE_MARQUE_* du .env > valeurs
// par defaut (SenYummies, pour Chez Ketchup). Meme fiche que l'App Client.
import { configuration } from './runtime'

const env = import.meta.env

// Declinaisons exactes de la marque par defaut (maquettes d'origine).
const DEFAUT = {
  nom: 'SenYummies',
  accent: 'Yummies',
  etablissement: 'Chez Ketchup',
  couleur: '#A6192E',
  vif: '#E14B64', // accent sur fond sombre (mode sombre, ecrans Cuisine)
  pale: '#FBEAEC', // fonds teintes (badges, cartes selectionnees)
  bordure: '#E6C2C9', // bordures teintees
  rose: '#F3B0BB', // texte clair sur fond sombre
}

const nom = configuration('MARQUE_NOM', env.VITE_MARQUE_NOM, DEFAUT.nom)
const nomParDefaut = nom === DEFAUT.nom

/** Initiales du monogramme : majuscules du nom ("SenYummies" -> "SY"), sinon 2 premieres lettres. */
export function initialesDe(texte) {
  const mots = String(texte).trim().split(/\s+/).filter(Boolean)
  const majuscules = String(texte).replace(/[^A-ZÀ-Ý]/g, '')
  if (mots.length > 1) return mots.slice(0, 2).map((m) => m[0]).join('').toUpperCase()
  if (majuscules.length >= 2) return majuscules.slice(0, 2)
  return String(texte).trim().slice(0, 2).toUpperCase()
}

/** "#A6192E", "A6192E" ou "#a19" -> [166, 25, 46] ; null si invalide. */
export function rgbDe(hex) {
  let h = String(hex || '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

/** Melange d'une couleur avec du blanc (part > 0) ou du noir (part < 0). */
export function nuance(rgb, part) {
  const cible = part > 0 ? 255 : 0
  const p = Math.abs(part)
  return rgb.map((c) => Math.round(c + (cible - c) * p))
}

/** Codes communs a l'App Client et au backend (MoyenPaiement.java). */
export const TOUS_LES_PAIEMENTS = ['wave', 'orange-money', 'mixx-yas', 'carte', 'especes']

/** "wave, carte" -> ['wave', 'carte'] (ordre canonique, codes inconnus ignores) ; vide -> tous. */
export function listeDe(texte, connus) {
  const liste = String(texte || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter((x) => connus.includes(x))
  return liste.length ? connus.filter((x) => liste.includes(x)) : [...connus]
}

/** "/marque/a.jpg, /marque/b.jpg" -> ['/marque/a.jpg', '/marque/b.jpg'] */
export const urlsDe = (texte) => String(texte || '').split(',').map((u) => u.trim()).filter(Boolean)

export const hexDe = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase()

const couleurRgb =
  rgbDe(configuration('MARQUE_COULEUR', env.VITE_MARQUE_COULEUR, DEFAUT.couleur)) || rgbDe(DEFAUT.couleur)
const couleurParDefaut = hexDe(couleurRgb) === DEFAUT.couleur
// Declinaisons : exactes pour la couleur par defaut, calculees sinon.
const decliner = (exacte, part) => (couleurParDefaut ? rgbDe(exacte) : nuance(couleurRgb, part))
const vifRgb =
  rgbDe(configuration('MARQUE_COULEUR_CLAIRE', env.VITE_MARQUE_COULEUR_CLAIRE, '')) || decliner(DEFAUT.vif, 0.35)

export const marque = Object.freeze({
  nom,
  // Partie du nom mise en couleur (fin du nom) : "SenYummies" -> SEN + YUMMIES.
  accent: configuration('MARQUE_NOM_ACCENT', env.VITE_MARQUE_NOM_ACCENT, nomParDefaut ? DEFAUT.accent : ''),
  initiales: configuration('MARQUE_INITIALES', env.VITE_MARQUE_INITIALES, initialesDe(nom)),
  // URL d'un logo (carre) : remplace le monogramme.
  logo: configuration('MARQUE_LOGO_URL', env.VITE_MARQUE_LOGO_URL, ''),
  // Nom du restaurant sur les tickets (vide = le nom de la marque seul).
  etablissement: configuration(
    'MARQUE_ETABLISSEMENT',
    env.VITE_MARQUE_ETABLISSEMENT,
    nomParDefaut ? DEFAUT.etablissement : '',
  ),
  couleur: hexDe(couleurRgb),
  couleurRgb,
  vifRgb,
  pale: hexDe(decliner(DEFAUT.pale, 0.9)),
  bordure: hexDe(decliner(DEFAUT.bordure, 0.72)),
  rose: hexDe(decliner(DEFAUT.rose, 0.62)),
  // Photos de l'ecran de connexion (vide = photos par defaut).
  connexionImages: urlsDe(configuration('MARQUE_CONNEXION_IMAGES', env.VITE_MARQUE_CONNEXION_IMAGES, '')),
  // Moyens de paiement proposes (caisse du Vendeur) ; le backend refuse les autres.
  paiements: listeDe(configuration('MARQUE_PAIEMENTS', env.VITE_MARQUE_PAIEMENTS, ''), TOUS_LES_PAIEMENTS),
  // Coordonnees imprimees en pied des tickets et recus.
  adresse: configuration('MARQUE_ADRESSE', env.VITE_MARQUE_ADRESSE, ''),
  telephone: configuration('MARQUE_TELEPHONE', env.VITE_MARQUE_TELEPHONE, ''),
})

/** Nom decoupe pour l'affichage en deux tons : { debut, accent }. */
export function nomEnDeuxTons(m = marque) {
  const { nom: n, accent } = m
  if (accent && n.toLowerCase().endsWith(accent.toLowerCase()) && accent.length < n.length) {
    return { debut: n.slice(0, n.length - accent.length), accent: n.slice(n.length - accent.length) }
  }
  return { debut: n, accent: '' }
}

/** En-tete des tickets : "SenYummies · Chez Ketchup", ou le nom seul. */
export function signatureTicket(m = marque) {
  return m.etablissement && m.etablissement !== m.nom ? `${m.nom} · ${m.etablissement}` : m.nom
}

/** Pied des tickets : "Adresse · +221 33 000 00 00", ou vide si non renseigne. */
export function coordonneesTicket(m = marque) {
  return [m.adresse, m.telephone].filter(Boolean).join(' · ')
}

/**
 * Applique la marque a la page, avant le premier rendu : variables CSS
 * (--marque et ses declinaisons, utilisees par toutes les feuilles de
 * style) et titre de l'onglet.
 */
export function appliquerMarque(m = marque, doc = document) {
  const racine = doc.documentElement.style
  racine.setProperty('--marque', m.couleur)
  racine.setProperty('--marque-rgb', m.couleurRgb.join(' '))
  racine.setProperty('--marque-vif', hexDe(m.vifRgb))
  racine.setProperty('--marque-vif-rgb', m.vifRgb.join(' '))
  racine.setProperty('--marque-pale', m.pale)
  racine.setProperty('--marque-bordure', m.bordure)
  racine.setProperty('--marque-rose', m.rose)
  doc.title = `${m.nom} Manager`
}
