import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

// Sous-modal ouvert depuis une ligne du panier (bouton "Accompagnement")
// pour choisir l'accompagnement de CETTE ligne precise, sans etape dediee
// dans le stepper (Controle explicite et liberte de parcours — chaque ligne
// se gere independamment, dans l'ordre souhaite). Choisir une option
// l'applique immediatement et referme le sous-modal.
export default function AccompagnementModal({ ligne, accompagnementsDisponibles, onChoisir, onFermer }) {
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
          <h2 id="vendeur-accomp-modal-titre">Accompagnement — {ligne.nom}</h2>
          <button type="button" className="vendeur-panier-modal-fermer" aria-label="Fermer le choix d’accompagnement" onClick={onFermer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <ul className="vendeur-accomp-choix-liste">
          <li>
            <button
              type="button"
              className={`vendeur-accomp-choix ${!ligne.accompagnementId ? 'is-selected' : ''}`}
              onClick={() => onChoisir(null)}
            >
              <span>Aucun accompagnement</span>
              {!ligne.accompagnementId && <i className="fa-solid fa-check" aria-hidden="true" />}
            </button>
          </li>
          {accompagnementsDisponibles.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`vendeur-accomp-choix ${ligne.accompagnementId === a.id ? 'is-selected' : ''}`}
                onClick={() => onChoisir(a.id)}
              >
                <span>{a.nom}</span>
                <span className="vendeur-accomp-choix-prix">
                  +{formatFCFA(a.prix)}
                  {ligne.accompagnementId === a.id && <i className="fa-solid fa-check" aria-hidden="true" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
