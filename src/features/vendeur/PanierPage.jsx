import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import AccompagnementModal from './AccompagnementModal.jsx'
import { MODES_PAIEMENT } from './modesPaiement.jsx'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'

const ETAPE_LABELS = {
  panier: 'Panier',
  paiement: 'Paiement',
}
const ETAPES_VISIBLES = ['panier', 'paiement']

// Page plein ecran du panier (ouverte depuis le bouton "Panier" de
// Vente.jsx — remplace la vue catalogue, meme pattern que le ticket qui
// remplace deja toute la page apres encaissement). Stepper a 2 etapes
// seulement : Panier -> Paiement. L'accompagnement n'est plus une etape
// dediee : chaque ligne eligible a son propre bouton qui ouvre un
// sous-modal (AccompagnementModal), pour plus de liberte dans l'ordre des
// choix (Controle explicite, criteres de Bastien & Scapin).
//
// Deux facons de quitter la page : "Retour au catalogue" (non destructif,
// garde le panier, pour continuer a ajouter des produits) et "Annuler"
// (destructif, vide le panier — demande confirmation via ConfirmModal des
// que le panier contient au moins un article, pour eviter une perte
// accidentelle — Gestion des erreurs).
export default function PanierPage({
  panier,
  accompagnementsDisponibles,
  onChangerQuantite,
  onRetirer,
  onChoisirAccompagnement,
  onConfirmerPaiement,
  onRetourCatalogue,
  onAnnuler,
}) {
  const [etape, setEtape] = useState('panier')
  const [ligneAccompagnementOuverte, setLigneAccompagnementOuverte] = useState(null)
  const [confirmationAnnulerOuverte, setConfirmationAnnulerOuverte] = useState(false)
  const [modePaiement, setModePaiement] = useState(null)
  const [montantRecu, setMontantRecu] = useState('')

  const total = panier.reduce((somme, l) => somme + l.prix * l.quantite, 0)
  const nombreArticlesPanier = panier.reduce((somme, l) => somme + l.quantite, 0)
  const montantRecuNombre = Number(montantRecu) || 0
  const monnaieRendue = modePaiement === 'especes' ? Math.max(0, montantRecuNombre - total) : 0
  const paiementValide = modePaiement === 'especes'
    ? montantRecuNombre >= total && total > 0
    : Boolean(modePaiement) && total > 0

  const indexEtape = ETAPES_VISIBLES.indexOf(etape)
  const ligneOuverte = panier.find((l) => l.produitId === ligneAccompagnementOuverte) || null

  function allerAPaiement() {
    if (panier.length === 0) return
    setEtape('paiement')
  }

  function revenirAuPanier() {
    setEtape('panier')
  }

  function allerAEtape(key) {
    // Navigation retour uniquement : on ne peut pas sauter une etape en
    // cliquant en avant (Controle explicite, Gestion des erreurs).
    const indexCible = ETAPES_VISIBLES.indexOf(key)
    if (indexCible === -1 || indexCible >= indexEtape) return
    setEtape(key)
  }

  function demanderAnnulation() {
    if (panier.length === 0) {
      onAnnuler()
      return
    }
    setConfirmationAnnulerOuverte(true)
  }

  function confirmerAnnulation() {
    setConfirmationAnnulerOuverte(false)
    onAnnuler()
  }

  function confirmerPaiement(e) {
    e.preventDefault()
    if (!paiementValide) return
    const montant = modePaiement === 'especes' ? montantRecuNombre : total
    onConfirmerPaiement(modePaiement, montant)
  }

  return (
    <Layout>
      <div className="vendeur-pos-page">
        <div className="vendeur-panier-page-head">
          <div>
            <p className="manager-eyebrow">Vendeur</p>
            <h1>Panier</h1>
            <p>{nombreArticlesPanier} article{nombreArticlesPanier > 1 ? 's' : ''} — {formatFCFA(total)}</p>
          </div>
          <div className="vendeur-panier-page-head-actions">
            <button type="button" className="manager-button manager-button-quiet" onClick={onRetourCatalogue}>
              ← Retour au catalogue
            </button>
            <button type="button" className="vendeur-annuler-bouton" onClick={demanderAnnulation}>
              Annuler
            </button>
          </div>
        </div>

        <nav className="vendeur-stepper" aria-label="Étapes de la vente">
          {ETAPES_VISIBLES.map((key, index) => (
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
          <div className="vendeur-panier-corps">
            {panier.length === 0 ? (
              <p className="vendeur-pos-panier-empty">Le panier est vide — retournez au catalogue pour ajouter des produits.</p>
            ) : (
              <ul className="vendeur-panier-lignes-riches">
                {panier.map((ligne) => (
                  <li key={ligne.produitId} className="vendeur-panier-ligne-riche">
                    <img className="vendeur-panier-ligne-photo" src={ligne.photoUrl} alt="" />
                    <div className="vendeur-panier-ligne-info">
                      <strong>{ligne.nom}</strong>
                      <span className="vendeur-panier-ligne-prix-unitaire">{formatFCFA(ligne.prixBase)} / unité</span>
                      {ligne.accompagnementEligible && (
                        <button
                          type="button"
                          className="vendeur-panier-ligne-accomp-bouton"
                          onClick={() => setLigneAccompagnementOuverte(ligne.produitId)}
                        >
                          <i className="fa-solid fa-utensils" aria-hidden="true" />
                          {ligne.accompagnementNom ? `Accompagnement : ${ligne.accompagnementNom}` : 'Ajouter un accompagnement'}
                        </button>
                      )}
                    </div>
                    <span className="vendeur-pos-panier-qte">
                      <button type="button" aria-label={`Retirer un ${ligne.nom}`} onClick={() => onChangerQuantite(ligne.produitId, -1)}>−</button>
                      <span>{ligne.quantite}</span>
                      <button type="button" aria-label={`Ajouter un ${ligne.nom}`} onClick={() => onChangerQuantite(ligne.produitId, 1)}>+</button>
                    </span>
                    <span className="vendeur-panier-ligne-total">{formatFCFA(ligne.prix * ligne.quantite)}</span>
                    <button
                      type="button"
                      className="vendeur-pos-panier-retirer"
                      aria-label={`Retirer ${ligne.nom} du panier`}
                      onClick={() => onRetirer(ligne.produitId)}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="vendeur-pos-panier-total">
              <span>Total</span>
              <strong>{formatFCFA(total)}</strong>
            </div>

            <div className="vendeur-panier-page-nav">
              <button type="button" className="manager-button manager-button-primary" disabled={panier.length === 0} onClick={allerAPaiement}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {etape === 'paiement' && (
          <div className="vendeur-panier-corps vendeur-panier-corps-paiement">
            <h2>Mode de paiement</h2>
            <div className="vendeur-paiement-modes" role="radiogroup" aria-label="Mode de paiement">
              {MODES_PAIEMENT.map((mode) => (
                <button
                  type="button"
                  key={mode.key}
                  role="radio"
                  aria-checked={modePaiement === mode.key}
                  className={`vendeur-paiement-mode ${modePaiement === mode.key ? 'is-selected' : ''}`}
                  onClick={() => setModePaiement(mode.key)}
                >
                  <mode.Logo />
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>

            <form className="vendeur-paiement-form" onSubmit={confirmerPaiement}>
              <div className="vendeur-pos-paiement-total">
                <span>Total à payer</span>
                <strong>{formatFCFA(total)}</strong>
              </div>

              {modePaiement === 'especes' && (
                <>
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
                  <label>
                    Monnaie à rendre
                    <input type="text" className="vendeur-paiement-lecture-seule" readOnly value={formatFCFA(monnaieRendue)} />
                  </label>
                </>
              )}

              <div className="manager-modal-actions">
                <button className="manager-button manager-button-quiet" type="button" onClick={revenirAuPanier}>
                  ← Retour
                </button>
                <button className="manager-button manager-button-primary" type="submit" disabled={!paiementValide}>
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {ligneOuverte && (
        <AccompagnementModal
          ligne={ligneOuverte}
          accompagnementsDisponibles={accompagnementsDisponibles}
          onChoisir={(accompagnementId) => {
            onChoisirAccompagnement(ligneOuverte.produitId, accompagnementId)
            setLigneAccompagnementOuverte(null)
          }}
          onFermer={() => setLigneAccompagnementOuverte(null)}
        />
      )}

      {confirmationAnnulerOuverte && (
        <ConfirmModal
          title="Annuler la vente ?"
          message={`Le panier (${nombreArticlesPanier} article${nombreArticlesPanier > 1 ? 's' : ''}) sera vidé et vous reviendrez au catalogue.`}
          confirmLabel="Oui, annuler"
          cancelLabel="Non, revenir"
          tone="danger"
          icon="fa-trash"
          onConfirm={confirmerAnnulation}
          onCancel={() => setConfirmationAnnulerOuverte(false)}
        />
      )}
    </Layout>
  )
}
