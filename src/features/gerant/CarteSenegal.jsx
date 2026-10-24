import { POSITION_CARTE, REGIONS } from './senegalZones.js'

// Carte cliquable des 14 regions du Senegal - schematique (grille CSS),
// pas des contours geographiques exacts : voir la note dans
// senegalZones.js. Suffisant pour choisir une region visuellement sans
// depender de donnees geographiques precises, pour une page entierement
// mockee (voir zonesLivraisonData.js).
export default function CarteSenegal({ actives, selected, onSelect, ariaLabel = 'Carte des régions du Sénégal' }) {
  return (
    <div className="senegal-carte">
      <div className="senegal-carte-grille" role="group" aria-label={ariaLabel}>
        {REGIONS.map((region) => {
          const position = POSITION_CARTE[region.code]
          const estRegionActive = actives.includes(region.code)
          const estSelectionnee = selected === region.code
          return (
            <button
              key={region.code}
              type="button"
              className={`senegal-region ${estRegionActive ? 'is-active' : ''} ${estSelectionnee ? 'is-selected' : ''}`}
              style={{
                gridColumn: `${position.colonne} / span ${position.colspan || 1}`,
                gridRow: `${position.ligne} / span ${position.lignespan || 1}`,
              }}
              aria-pressed={estSelectionnee}
              onClick={() => onSelect(region.code)}
            >
              <span className="senegal-region-nom">{region.nom}</span>
              {estRegionActive && <i className="fa-solid fa-circle-check senegal-region-badge" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <p className="senegal-carte-legende">
        <i className="fa-solid fa-circle-check" aria-hidden="true" /> région avec zone de livraison active. Carte schématique à but d’orientation, positions non géographiquement exactes.
      </p>
    </div>
  )
}
