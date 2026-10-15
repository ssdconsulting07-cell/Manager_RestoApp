// Modes de paiement acceptes au comptoir.
//
// Tous les modes utilisent de vrais logos :
// - Wave : icone officielle de l'appli (le pingouin sur fond bleu ciel),
//   recuperee sur wave.com (/img/favicon.png, PNG 192x192), servie depuis
//   public/logos-paiement/wave.png. Wave ne publie pas de kit presse ni de
//   version SVG.
// - Mixx by Yas : logo officiel (mot "mixx" jaune + "By yas"), SVG recupere
//   sur la page Mixx du site Yas Senegal (yas.sn/mixx-by-yas,
//   wp-content/uploads/2025/09/Visuel-mixx-site-web_logo.svg), servi depuis
//   public/logos-paiement/mixx-yas.svg, pose sur le bleu marine de la
//   marque (#003881) comme sur leurs visuels. Mixx by Yas est l'ex Free
//   Money de l'operateur Free, renomme Yas (groupe AXIAN) en 2024.
// - Visa et Mastercard : tracés reels recuperes depuis simple-icons
//   (couleurs officielles appliquees ici — bleu Visa #1A1F71, cercles rouge
//   #EB001B / orange #F79E1B de Mastercard avec fusion "multiply" pour la
//   zone de recouvrement, comme sur les vraies cartes).
// - Orange Money : le symbole officiel du service (deux fleches croisees),
//   traces repris du SVG publie sur orange.sn
//   (sites/default/files/images/orange-money-white.svg, version blanche pour
//   fond orange), recolores comme l'icone officielle couleur de Sonatel
//   (fleche montante noire, fleche descendante orange #FF7900) sur badge
//   blanc. Ce n'est PAS le carre Orange, qui est le logo de l'operateur.
// - Especes : icone standard Font Awesome (billet), pas une marque.
//
// Les logos Wave et Mixx by Yas sont des fichiers statiques (public/), dans
// le meme badge arrondi 26x26 que les logos SVG inline des autres modes.
function WaveLogo() {
  return (
    <span className="vendeur-paiement-logo-badge" aria-hidden="true">
      <img src="/logos-paiement/wave.png" alt="" />
    </span>
  )
}

function OrangeMoneyLogo() {
  // Traces officiels des deux fleches (orange.sn), sans modification de forme.
  // Le viewBox recadre sur les fleches (le SVG d'origine fait 40x40 avec
  // beaucoup de marge) pour qu'elles remplissent le badge comme les autres.
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#fff" />
      <svg x="5" y="5" width="38" height="38" viewBox="3 4.5 32 32">
        <path
          fill="#000"
          transform="translate(4 13.765)"
          d="M3.413.333c-1.034 0-1.871.832-1.871 1.858 0 1.027.837 1.859 1.87 1.859h4.699L.548 11.56a1.85 1.85 0 0 0 0 2.628 1.88 1.88 0 0 0 2.646 0l7.562-7.512v4.667c0 1.026.837 1.858 1.871 1.858 1.033 0 1.87-.832 1.87-1.858V2.19a1.864 1.864 0 0 0-1.87-1.858H3.413z"
        />
        <path
          fill="#FF7900"
          transform="translate(19.867 12.065)"
          d="M2.372 14.902h9.215c1.033 0 1.87-.832 1.87-1.858a1.864 1.864 0 0 0-1.87-1.858H6.889l7.562-7.512a1.85 1.85 0 0 0 0-2.628 1.88 1.88 0 0 0-2.645 0L4.243 8.558V3.892a1.865 1.865 0 0 0-1.87-1.859c-1.034 0-1.871.832-1.871 1.859v9.152c0 1.026.837 1.858 1.87 1.858"
        />
      </svg>
    </svg>
  )
}

function MixxLogo() {
  return (
    <span className="vendeur-paiement-logo-badge is-mixx" aria-hidden="true">
      <img src="/logos-paiement/mixx-yas.svg" alt="" />
    </span>
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
