// Modes de paiement acceptes au comptoir.
//
// Carte bancaire, Orange Money et Especes utilisent de vrais logos :
// - Visa et Mastercard : tracés reels recuperes depuis simple-icons
//   (couleurs officielles appliquees ici — bleu Visa #1A1F71, cercles rouge
//   #EB001B / orange #F79E1B de Mastercard avec fusion "multiply" pour la
//   zone de recouvrement, comme sur les vraies cartes).
// - Orange Money : le vrai logo de marque Orange (le repere carre avec
//   l'encoche, identite "Orange is here" lancee en 2024), aussi depuis
//   simple-icons.
// - Especes : icone standard Font Awesome (billet), pas une marque.
//
// simple-icons (github.com/simple-icons/simple-icons, licence MIT, tracés
// verifies pour le respect des marques) est le seul depot de logos
// accessible depuis cet environnement : raw.githubusercontent.com est
// autorise par le proxy, mais itunes.apple.com, les domaines
// Wikipedia/Wikimedia, cdn.jsdelivr.net, unpkg.com, cdnjs.cloudflare.com,
// avatars.githubusercontent.com, cdn.simpleicons.org, img.logo.dev,
// logo.clearbit.com et cdn.brandfetch.io sont tous bloques.
//
// Wave et Mixx by Yas n'ont pas d'icone Font Awesome et ne sont pas dans
// simple-icons (plusieurs variantes de nom testees : wave, wavemoney,
// wave-money, mixx, mixxbyyas, freesenegal, yas — toutes en 404), et les
// services de logos alternatifs testes ci-dessus sont tous bloques par le
// proxy : ce sont des fintechs ouest-africaines trop recentes/niche pour
// ces depots, impossible d'obtenir leurs fichiers officiels ici. Leurs
// badges restent des reconstitutions maison aux couleurs de marque reelles
// (Wave = bleu nuit, Mixx by Yas = degrade violet/turquoise), pas des
// emojis ni des icones generiques. Pour les logos officiels exacts, deposer
// les fichiers dans public/logos-paiement/ (wave.svg, mixx-yas.svg) et
// remplacer les composants *Logo correspondants par
// <img src="/logos-paiement/....svg" alt="" />.
function WaveLogo() {
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#001A72" />
      <path
        d="M7 28c2.6-6.4 5-6.4 7.5 0s4.9 6.4 7.5 0 4.9-6.4 7.5 0 4.9 6.4 7.5 0 4.9-6.4 7.5 0"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OrangeMoneyLogo() {
  // Trace reel de la marque Orange (simple-icons, licence MIT), repris sans
  // modification dans le badge arrondi aux couleurs Orange Money.
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#FF7900" />
      <g transform="translate(9 9) scale(1.25)">
        <path d="M0 0h24v24H0V0Zm3.43 20.572h17.143v-3.429H3.43v3.429Z" fill="#fff" />
      </g>
    </svg>
  )
}

function MixxLogo() {
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="vendeur-mixx-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#7B2FF7" />
          <stop offset="1" stopColor="#00C2A8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#vendeur-mixx-grad)" />
      <text x="24" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="inherit">Mixx</text>
    </svg>
  )
}

function VisaLogo() {
  // Trace reel du mot-symbole Visa (simple-icons, licence MIT), sur fond
  // blanc, aux couleurs de marque (bleu Visa #1A1F71).
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#fff" />
      <svg x="8" y="8" width="32" height="32" viewBox="0 0 24 24">
        <path
          fill="#1A1F71"
          d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
        />
      </svg>
    </svg>
  )
}

function MastercardLogo() {
  // Les deux cercles entrelaces, aux couleurs officielles de la charte
  // Mastercard (rouge #EB001B, orange #F79E1B, fusion "multiply" sur la
  // zone de recouvrement pour obtenir la teinte orangee du vrai logo).
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#fff" />
      <g style={{ isolation: 'isolate' }}>
        <circle cx="19" cy="24" r="9" fill="#EB001B" />
        <circle cx="29" cy="24" r="9" fill="#F79E1B" style={{ mixBlendMode: 'multiply' }} />
      </g>
    </svg>
  )
}

function CarteBancaireLogo() {
  return (
    <span className="vendeur-paiement-mode-carte-icones" aria-hidden="true">
      <VisaLogo />
      <MastercardLogo />
    </span>
  )
}

function EspecesLogo() {
  return <i className="fa-solid fa-money-bill-wave" aria-hidden="true" />
}

export const MODES_PAIEMENT = [
  { key: 'wave', label: 'Wave', Logo: WaveLogo },
  { key: 'orange-money', label: 'Orange Money', Logo: OrangeMoneyLogo },
  { key: 'mixx-yas', label: 'Mixx by Yas', Logo: MixxLogo },
  { key: 'carte', label: 'Carte bancaire', Logo: CarteBancaireLogo },
  { key: 'especes', label: 'Espèces', Logo: EspecesLogo },
]

export function libelleModePaiement(key) {
  return MODES_PAIEMENT.find((m) => m.key === key)?.label ?? 'Espèces'
}
