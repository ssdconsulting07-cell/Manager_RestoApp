// Modes de paiement acceptes au comptoir.
//
// Carte bancaire et Especes utilisent de vraies icones (Font Awesome, deja
// charge par l'app — voir index.html) : Visa/Mastercard sont les logos reels
// des reseaux, et le billet pour les especes est une icone standard (pas une
// marque).
//
// Wave / Orange Money / Mixx by Yas n'ont pas d'icone Font Awesome : ce
// sont des fintechs ouest-africaines. Cet environnement n'a pas d'acces
// reseau sortant vers les CDN de logos (itunes.apple.com, wikimedia, etc. —
// testes et bloques par le proxy), donc impossible de recuperer les
// fichiers officiels ici. Les badges ci-dessous sont des reconstitutions
// maison aux couleurs de marque reelles (Wave = bleu nuit, Orange Money =
// orange Orange, Mixx by Yas = degrade violet/turquoise de Yas), pas des
// emojis ni des icones generiques. Pour les logos officiels exacts, deposer
// les fichiers dans public/logos-paiement/ (wave.svg, orange-money.svg,
// mixx-yas.svg) et remplacer les composants *Logo ci-dessous par
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
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#FF7900" />
      <rect x="12" y="19" width="24" height="15" rx="2.4" fill="#fff" />
      <path d="M13 19v-3.2a2.2 2.2 0 0 1 2.2-2.2H33" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="29.5" cy="26.5" r="2.8" fill="#FF7900" />
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
