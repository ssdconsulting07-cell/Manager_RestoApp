import { useState } from 'react'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

// Modal du panier, ouvert depuis le bouton "Panier" de Vente.jsx. Reprend le
// parcours en etapes deja valide, conforme aux criteres de Bastien & Scapin :
// Panier -> Accompagnements (seulement si au moins un plat eligible dans le
// panier, sinon l'etape est sautee — Guidage/Charge de travail) -> Paiement.
// Le ticket (Recu.jsx) reste affiche en pleine page par Vente.jsx une fois
// le paiement confirme, hors de ce modal.
//
// L'etape courante et le montant recu sont un etat local a ce composant : le
// modal est demonte a la fermeture (rendu conditionnel cote Vente.jsx), donc
// cet etat repart gratuitement de zero a chaque ouverture — pas besoin de le
// reinitialiser nous-memes.
const ETAPE_LABELS = {
  panier: 'Panier',
  accompagnements: 'Accompagnements',
  paiement: 'Paiement',
}

export default function PanierModal({
  panier,
  accompagnementsDisponibles,
  onChangerQuantite,
  onRetirer,
  onVider,
  onChoisirAccompagnement,
  onConfirmer,
  onFermer,
}) {
  const [etape, setEtape] = useState('panier')
  const [montantRecu, setMontantRecu] = useState('')

  const total = panier.reduce((somme, l) => somme + l.prix * l.quantite, 0)
  const nombreArticlesPanier = panier.reduce((somme, l) => somme + l.quantite, 0)
  const montantRecuNombre = Number(montantRecu) || 0
  const monnaieRendue = Math.max(0, montantRecuNombre - total)
  const paiementValide = montantRecuNombre >= total && total > 0

  // Lignes du panier eligibles a un accompagnement (Burgers / Plats du jour).
  const lignesEligibles = panier.filter((l) => l.accompagnementEligible)
  const aDesLignesEligibles = lignesEligibles.length > 0

  const etapesVisibles = aDesLignesEligibles ? ['panier', 'accompagnements', 'paiement'] : ['panier', 'paiement']
  const indexEtape = etapesVisibles.indexOf(etape)

  function allerAEtapeSuivante() {
    if (etape === 'panier') {
      if (panier.length === 0) return
      setEtape(aDesLignesEligibles ? 'accompagnements' : 'paiement')
    } else if (etape === 'accompagnements') {
      setEtape('paiement')
    }
  }

  function revenirEtapePrecedente() {
    if (etape === 'paiement') {
      setEtape(aDesLignesEligibles ? 'accompagnements' : 'panier')
    } else if (etape === 'accompagnements') {
      setEtape('panier')
    }
  }

  function allerAEtape(key) {
    // Navigation retour uniquement : on ne peut pas sauter une etape en
    // cliquant en avant (Controle explicite, Gestion des erreurs).
    const indexCible = etapesVisibles.indexOf(key)
    if (indexCible === -1 || indexCible >= indexEtape) return
    setEtape(key)
  }

  function confirmerPaiement(e) {
    e.preventDefault()
    if (!paiementValide) return
    onConfirmer(montantRecuNombre)
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onClick={onFermer}>
      <div
        className="manager-modal manager-modal-wide vendeur-panier-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendeur-panier-modal-titre"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="manager-modal-header">
          <h2 id="vendeur-panier-modal-titre">Panier</h2>
          <button type="button" className="vendeur-panier-modal-fermer" aria-label="Fermer le panier" onClick={onFermer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <nav className="vendeur-stepper" aria-label="Étapes de la vente">
          {etapesVisibles.map((key, index) => (
            <button
              type="button"
              key={key}
              className={`vendeur-stepper-step ${index === indexEtape ? 'is-active' : ''} ${index < indexEtape ? 'is-done' : ''}`}
              aria-current={index === indexEtape ? 'step' : undefined}
              disabled={index >= indexEtape}
              onClick={() => allerAEtape(key)}
            >
              <span className="vendeur-stepper-bullet">{index < indexEtape ? <i className="fa-solid fa-check" aria-hidden="true" /> : index + 1}</span>
              <span className="vendeur-stepper-label">{ETAPE_LABELS[key]}</span>
            </button>
          ))}
        </nav>

        {etape === 'panier' && (
          <div className="vendeur-panier-modal-corps">
            {panier.length === 0 ? (
              <p className="vendeur-pos-panier-empty">Le panier est vide — ajoutez des produits depuis le catalogue.</p>
            ) : (
              <>
                <div className="vendeur-pos-panier-head">
                  <span className="vendeur-panier-modal-sous-titre">
                    {nombreArticlesPanier} article{nombreArticlesPanier > 1 ? 's' : ''}
                  </span>
                  <button type="button" className="vendeur-pos-vider" onClick={onVider}>
                    Vider
                  </button>
                </div>
                <ul className="vendeur-pos-panier-lignes">
                  {panier.map((ligne) => (
                    <li key={ligne.produitId}>
                      <span className="vendeur-pos-panier-nom">
                        {ligne.nom}
                        {ligne.accompagnementNom && <span className="vendeur-pos-panier-accomp"> + {ligne.accompagnementNom}</span>}
                      </span>
                      <span className="vendeur-pos-panier-qte">
                        <button type="button" aria-label={`Retirer un ${ligne.nom}`} onClick={() => onChangerQuantite(ligne.produitId, -1)}>−</button>
                        <span>{ligne.quantite}</span>
                        <button type="button" aria-label={`Ajouter un ${ligne.nom}`} onClick={() => onChangerQuantite(ligne.produitId, 1)}>+</button>
                      </span>
                      <span className="vendeur-pos-panier-prix">{formatFCFA(ligne.prix * ligne.quantite)}</span>
                      <button type="button" className="vendeur-pos-panier-retirer" aria-label={`Retirer ${ligne.nom} du panier`} onClick={() => onRetirer(ligne.produitId)}>
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="vendeur-pos-panier-total">
              <span>Total</span>
              <strong>{formatFCFA(total)}</strong>
            </div>
          </div>
        )}

        {etape === 'accompagnements' && (
          <div className="vendeur-stepper-panel vendeur-stepper-panel-modal">
            <h3>Choisissez un accompagnement</h3>
            <p className="vendeur-stepper-panel-hint">Facultatif — laissez « Aucun accompagnement » si le client n’en souhaite pas.</p>
            <ul className="vendeur-accomp-liste">
              {lignesEligibles.map((ligne) => (
                <li key={ligne.produitId} className="vendeur-accomp-ligne">
                  <span className="vendeur-accomp-nom">{ligne.quantite}× {ligne.nom}</span>
                  <select
                    className="crud-select"
                    aria-label={`Accompagnement pour ${ligne.nom}`}
                    value={ligne.accompagnementId || ''}
                    onChange={(e) => onChoisirAccompagnement(ligne.produitId, e.target.value)}
                  >
                    <option value="">Aucun accompagnement</option>
                    {accompagnementsDisponibles.map((a) => (
                      <option key={a.id} value={a.id}>{a.nom} (+{formatFCFA(a.prix)})</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>

            <div className="vendeur-pos-panier-total">
              <span>Total</span>
              <strong>{formatFCFA(total)}</strong>
            </div>
          </div>
        )}

        {etape === 'paiement' && (
          <div className="vendeur-stepper-panel vendeur-stepper-panel-modal">
            <h3>Paiement en espèces</h3>
            <form className="vendeur-paiement-form" onSubmit={confirmerPaiement}>
              <div className="vendeur-pos-paiement-total">
                <span>Total à payer</span>
                <strong>{formatFCFA(total)}</strong>
              </div>
              <label>
                Montant reçu (F CFA)
                <input
                  type="number"
                  min="0"
                  step="100"
                  inputMode="numeric"
                  autoFocus
                  value={montantRecu}
                  onChange={(e) => setMontantRecu(e.target.value)}
                  required
                />
              </label>
              <div className="vendeur-pos-paiement-monnaie">
                <span>Monnaie à rendre</span>
                <strong>{formatFCFA(monnaieRendue)}</strong>
              </div>
              <div className="manager-modal-actions">
                <button className="manager-button manager-button-quiet" type="button" onClick={revenirEtapePrecedente}>
                  ← Retour
                </button>
                <button className="manager-button manager-button-primary" type="submit" disabled={!paiementValide}>
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </div>
        )}

        {etape !== 'paiement' && (
          <div className="manager-modal-actions">
            {etape !== 'panier' && (
              <button type="button" className="manager-button manager-button-quiet" onClick={revenirEtapePrecedente}>
                ← Retour
              </button>
            )}
            <button
              type="button"
              className="manager-button manager-button-primary"
              disabled={panier.length === 0}
              onClick={allerAEtapeSuivante}
            >
              Continuer →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
