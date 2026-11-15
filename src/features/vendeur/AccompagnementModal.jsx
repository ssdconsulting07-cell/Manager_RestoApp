import { useState } from 'react'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

// Sous-modal ouvert depuis une ligne du panier : choix des accompagnements
// de CETTE ligne (plusieurs possibles, cases a cocher), puis Valider.
// Chaque ligne se gere independamment, dans l'ordre souhaite.
export default function AccompagnementModal({ ligne, accompagnementsDisponibles, onChoisir, onFermer }) {
  const [choisis, setChoisis] = useState(() =>
    (ligne.accompagnements || []).length
      ? ligne.accompagnements.map((a) => a.id)
      : ligne.accompagnementId ? [ligne.accompagnementId] : [],
  )
  const basculer = (id) => setChoisis((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const supplement = accompagnementsDisponibles
    .filter((a) => choisis.includes(a.id))
    .reduce((s, a) => s + Number(a.prix || 0), 0)

  return (
    <div className="manager-modal-backdrop" role="presentation" onClick={onFermer}>
      <div
        className="manager-modal vendeur-accomp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendeur-accomp-modal-titre"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="manager-modal-header">
          <h2 id="vendeur-accomp-modal-titre">Accompagnements — {ligne.nom}</h2>
          <button type="button" className="vendeur-panier-modal-fermer" aria-label="Fermer le choix d’accompagnement" onClick={onFermer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <p className="vendeur-accomp-aide">Plusieurs choix possibles{ligne.quantite > 1 ? ' — pour une unité, les autres gardent leur choix' : ''}.</p>

        <ul className="vendeur-accomp-choix-liste">
          {accompagnementsDisponibles.map((a) => {
            const actif = choisis.includes(a.id)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={actif}
                  className={`vendeur-accomp-choix ${actif ? 'is-selected' : ''}`}
                  onClick={() => basculer(a.id)}
                >
                  <span>{a.nom}</span>
                  <span className="vendeur-accomp-choix-prix">
                    {Number(a.prix) > 0 ? `+${formatFCFA(a.prix)}` : 'Offert'}
                    <i className={`fa-${actif ? 'solid fa-square-check' : 'regular fa-square'}`} aria-hidden="true" />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="manager-modal-actions">
          <button className="manager-button manager-button-quiet" type="button" onClick={() => setChoisis([])} disabled={!choisis.length}>
            Aucun
          </button>
          <button className="manager-button manager-button-primary" type="button" onClick={() => onChoisir(choisis)}>
            {choisis.length ? `Valider (${choisis.length})${supplement ? ` · +${formatFCFA(supplement)}` : ''}` : 'Sans accompagnement'}
          </button>
        </div>
      </div>
    </div>
  )
}
