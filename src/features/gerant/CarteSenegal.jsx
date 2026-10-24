import { useState } from 'react'
import { CENTROIDES_REGIONS, PATHS_REGIONS, VIEW_BOX } from './senegalGeo.js'
import { REGIONS } from './senegalZones.js'

// Carte cliquable des 14 regions du Senegal - vrais contours (simplifies,
// voir senegalGeo.js), pas un schema de grille. Les regions trop petites
// pour afficher leur nom a l'interieur (Dakar notamment) restent lisibles
// via l'infobulle native (<title>) et le nom affiche au survol/selection
// au-dessus de la carte.
export default function CarteSenegal({ actives, selected, onSelect, ariaLabel = 'Carte des régions du Sénégal' }) {
  const [survolee, setSurvolee] = useState(null)
  const codeAffiche = survolee || selected
  const regionAffichee = REGIONS.find((region) => region.code === codeAffiche)

  function activerSurvol(code) {
    setSurvolee(code)
  }

  function desactiverSurvol() {
    setSurvolee(null)
  }

  return (
    <div className="senegal-carte">
      <p className="senegal-carte-nom" aria-live="polite">
        {regionAffichee ? regionAffichee.nom : 'Survolez ou sélectionnez une région'}
      </p>
      <svg
        className="senegal-carte-svg"
        viewBox={`0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}`}
        role="group"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMid meet"
      >
        {REGIONS.map((region) => {
          const estRegionActive = actives.includes(region.code)
          const estSelectionnee = selected === region.code
          const [cx, cy] = CENTROIDES_REGIONS[region.code]
          return (
            <g
              key={region.code}
              className={`senegal-region ${estRegionActive ? 'is-active' : ''} ${estSelectionnee ? 'is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={estSelectionnee}
              aria-label={region.nom}
              onClick={() => onSelect(region.code)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(region.code)
                }
              }}
              onMouseEnter={() => activerSurvol(region.code)}
              onMouseLeave={desactiverSurvol}
              onFocus={() => activerSurvol(region.code)}
              onBlur={desactiverSurvol}
            >
              <title>{region.nom}</title>
              <path d={PATHS_REGIONS[region.code]} />
              {estRegionActive && (
                <circle className="senegal-region-point" cx={cx} cy={cy} r={5} aria-hidden="true" />
              )}
            </g>
          )
        })}
      </svg>
      <p className="senegal-carte-legende">
        <i className="fa-solid fa-circle-check" aria-hidden="true" /> région avec zone de livraison active.
      </p>
    </div>
  )
}
