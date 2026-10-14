// Modes de paiement acceptes au comptoir.
//
// Carte bancaire et Especes utilisent de vraies icones (Font Awesome, deja
// charge par l'app — voir index.html) : Visa/Mastercard sont les logos reels
// des reseaux, et le billet pour les especes est une icone standard (pas une
// marque).
//
// Orange Money utilise le vrai logo de marque Orange (le repere carre avec
// l'encoche, identite "Orange is here" lancee en 2024), recupere depuis
// simple-icons (github.com/simple-icons/simple-icons, licence MIT, tracés
// verifies pour le respect des marques) — seul depot de logos accessible
// depuis cet environnement : raw.githubusercontent.com est autorise par le
// proxy, mais itunes.apple.com, les domaines Wikipedia/Wikimedia,
// cdn.jsdelivr.net, unpkg.com, cdnjs.cloudflare.com et
// avatars.githubusercontent.com sont bloques.
//
// Wave et Mixx by Yas n'ont pas d'icone Font Awesome et ne sont pas dans
// simple-icons (plusieurs variantes de nom testees : wave, wavemoney,
// wave-money, mixx, mixxbyyas, freesenegal, yas — toutes en 404) : ce sont
// des fintechs ouest-africaines trop recentes/niche pour ce depot. Leurs
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

function CarteBancaireLogo() {
  return (
    <span className="vendeur-paiement-mode-carte-icones" aria-hidden="true">
      <i className="fa-brands fa-cc-visa" />
      <i className="fa-brands fa-cc-mastercard" />
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
