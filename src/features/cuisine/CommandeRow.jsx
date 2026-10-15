import { useState } from 'react'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import {
  canalLabel,
  estComptoir,
  formatDuree,
  formatHeure,
  modeLabel,
  nomProduit,
  noteCommande,
  photoProduit,
  resumePlats,
  texteAccompagnement,
  textePersonnalisation,
} from './cuisineUtils.js'

const LABEL_COURT = {
  EN_PREPARATION: 'Commencer',
  PRETE: 'Marquer prête',
  // Commande App + Livraison en statut Prete (voir transitions.js) : bouton
  // manuel, la cuisine ne l'actionne qu'une fois le livreur reellement
  // pret a partir — remplace la note statique "En attente de retrait" qui
  // n'a pas de sens pour une livraison (cf. emptyActionLabel plus bas, qui
  // ne s'affiche de toute facon plus ici puisque transitions n'est plus
  // vide dans ce cas).
  EN_LIVRAISON: 'Envoyer au livreur',
}

/** Ligne de commande cuisine, repliable — retour utilisateur : le ticket et
 * le bouton d'action principal doivent se voir d'un coup d'œil, sans avoir a
 * ouvrir quoi que ce soit. Pas de badge de statut sur la ligne (retour
 * utilisateur) : les cartes-filtres au-dessus montrent deja l'etat, le
 * repeter sur chaque ligne n'apportait rien. La pastille temps n'affiche
 * plus l'heure absolue (deja dans le resume juste en dessous) mais
 * seulement le delai ecoule ("il y a X min") ; le badge "Priorité" separe
 * est retire aussi — l'accent rouge de la ligne (is-urgent) et le
 * "en retard" de la pastille temps (is-late) suffisent a signaler l'alerte.
 *
 * showDuree est passe par tous les appelants desormais (tableau unique) : le
 * badge de retard (20 min) s'applique donc a n'importe quelle etape, pas
 * seulement en preparation comme avant — une commande prete oubliee 20 min
 * en attente de retrait est tout aussi digne d'etre signalee.
 * emptyActionLabel (+ emptyActionIcon) s'affiche a la place du bouton
 * d'action quand transitions est vide (PRETE en retrait/comptoir, ou
 * EN_LIVRAISON : CUISINE n'a aucune transition sortante depuis l'un ou
 * l'autre, voir transitions.js) pour confirmer l'etat plutot que de
 * laisser un espace vide.
 *
 * Partie depliee (cuisine-row-details) : retour utilisateur — trop serree
 * (photos 40px, texte 12-13px, pas de separation entre plats) pour un vrai
 * detail de commande en cuisine. Espacement et tailles alignes sur le reste
 * de l'appli (cf. crud-filter-card) plutot que sur la ligne compacte
 * au-dessus, avec un libelle de section ("Plats commandes (N)"), un
 * separateur entre chaque plat et un libelle "Note du client" explicite
 * plutot qu'une simple icone.
 *
 * "Envoyer au livreur" (PRETE -> EN_LIVRAISON, voir transitions.js) passe
 * par une confirmation (ConfirmModal) avant d'appeler onTransition — relu
 * par l'agent local : aucune transition retour n'existe depuis EN_LIVRAISON,
 * un appui accidentel sur une tablette de cuisine enverrait la commande
 * sans recours. Les autres transitions (Commencer/Marquer prete) restent
 * directes, sans confirmation : erreur sans consequence reelle, on avance
 * juste le ticket d'une etape qu'on allait franchir de toute facon. */
export default function CommandeRow({
  commande,
  produits,
  transitions,
  pending,
  onTransition,
  showDuree = false,
  emptyActionLabel = null,
  emptyActionIcon = 'fa-circle-check',
}) {
  const [deplie, setDeplie] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const note = noteCommande(commande)
  const urgente = showDuree && Date.now() - new Date(commande.creeLe).getTime() > 20 * 60_000
  const enPreparation = commande.statut === 'EN_PREPARATION'
  const prete = commande.statut === 'PRETE'
  const enLivraison = commande.statut === 'EN_LIVRAISON'
  const lignes = commande.lignes || []
  const duree = formatDuree(commande.creeLe)
  const texteDuree = duree === 'À l’instant' ? duree : `il y a ${duree}`
  const comptoir = estComptoir(commande)
  // Nombre de plats a preparer (somme des quantites), pas le nombre de
  // lignes — relecture agent local : "2x Burger, 1x Frites" est 1 ligne
  // de burger + 1 ligne de frites (2 lignes) mais 3 plats a sortir, et
  // c'est ce deuxieme chiffre qui compte en cuisine.
  const totalPlats = lignes.reduce((total, ligne) => total + (ligne.quantite || 0), 0)
  const ticketId = String(commande.id).replace(/^demo-/, '')
  const detailsId = `commande-detail-${ticketId}`

  return (
    <article
      className={`cuisine-row${enPreparation ? ' is-prep' : ''}${prete ? ' is-ready' : ''}${enLivraison ? ' is-delivering' : ''}${urgente ? ' is-urgent' : ''}${deplie ? ' is-expanded' : ''}`}
    >
      <div className="cuisine-row-head" onClick={() => setDeplie((v) => !v)}>
        <div className="cuisine-row-top">
          <div className="cuisine-row-info">
            <span className="cuisine-row-id">#{ticketId}</span>
            <span className={`cuisine-row-pill is-canal${comptoir ? ' is-comptoir' : ''}`}>
              <i className={`fa-solid ${comptoir ? 'fa-store' : 'fa-mobile-screen-button'}`} aria-hidden="true" />
              {canalLabel(commande)}
            </span>
            {!comptoir && (
              <span className="cuisine-row-pill">
                <i
                  className={`fa-solid ${commande.mode === 'LIVRAISON' ? 'fa-motorcycle' : 'fa-bag-shopping'}`}
                  aria-hidden="true"
                />
                {modeLabel(commande.mode)}
              </span>
            )}
            <span className={`cuisine-row-pill is-time${urgente ? ' is-late' : ''}`}>
              <i className="fa-solid fa-clock" aria-hidden="true" />
              {showDuree ? texteDuree : formatHeure(commande.creeLe)}
            </span>
          </div>

          <div className="cuisine-row-primary">
            {transitions.length > 0 ? (
              transitions.map((t) => (
                <button
                  key={t.to}
                  type="button"
                  disabled={pending}
                  onClick={(event) => {
                    // Le bouton d'action vit dans cuisine-row-head, qui
                    // deplie/replie au clic (toute la barre cliquable,
                    // retour utilisateur) — sans stopPropagation, agir sur
                    // la commande la deplierait/replierait aussi par
                    // accident.
                    event.stopPropagation()
                    if (t.to === 'EN_LIVRAISON') {
                      setConfirmation(t)
                    } else {
                      onTransition(t.to)
                    }
                  }}
                  className="manager-button manager-button-primary"
                >
                  {pending ? '…' : LABEL_COURT[t.to] || t.label}
                </button>
              ))
            ) : emptyActionLabel ? (
              <span className="cuisine-row-ready-note">
                <i className={`fa-solid ${emptyActionIcon}`} aria-hidden="true" />
                {emptyActionLabel}
              </span>
            ) : null}
          </div>

          {/* Pas de onClick ici : le clic (ou l'activation clavier) remonte
              a cuisine-row-head, seul point qui deplie/replie — ce bouton
              reste neanmoins la cible accessible au clavier (focus +
              Entree/Espace), avec son propre libelle et son etat
              aria-expanded. */}
          <button
            type="button"
            className={`cuisine-row-toggle${deplie ? ' is-expanded' : ''}`}
            aria-expanded={deplie}
            aria-controls={detailsId}
            aria-label={deplie ? `Masquer le détail de la commande ${ticketId}` : `Voir le détail de la commande ${ticketId}`}
          >
            <i className="fa-solid fa-chevron-down" aria-hidden="true" />
          </button>
        </div>

        {/* Toujours visible, meme repliee : retour utilisateur — sans ça,
            le personnel ne voit plus du tout l'heure ni quoi preparer sans
            deplier chaque ticket un par un en plein service. */}
        <p className="cuisine-row-summary">
          {formatHeure(commande.creeLe)} · {resumePlats(lignes, produits)}
        </p>
      </div>

      {deplie && (
        <div className="cuisine-row-details" id={detailsId}>
          <div className="cuisine-row-section">
            <p className="cuisine-row-section-title">Plats commandés ({totalPlats})</p>
            <ul className="cuisine-row-lines">
              {lignes.map((ligne, i) => {
                const perso = textePersonnalisation(ligne)
                const accompagnement = texteAccompagnement(ligne)
                return (
                  <li key={i} className="cuisine-row-line">
                    <span className="cuisine-row-line-photo">
                      <CoverPhoto src={photoProduit(produits, ligne.produitId)} />
                      <span className="cuisine-row-line-qty">{ligne.quantite}×</span>
                    </span>
                    <div className="cuisine-row-line-copy">
                      <strong>{ligne.quantite}× {nomProduit(produits, ligne.produitId)}</strong>
                      {accompagnement && (
                        <span className="cuisine-row-line-accomp">
                          <i className="fa-solid fa-utensils" aria-hidden="true" /> Avec {accompagnement}
                        </span>
                      )}
                      {perso && (
                        <span className="cuisine-row-line-perso">
                          <i className="fa-solid fa-pen" aria-hidden="true" /> {perso}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {note && (
            <div className="cuisine-row-note">
              <i className="fa-solid fa-comment" aria-hidden="true" />
              <div>
                <p className="cuisine-row-note-title">Note du client</p>
                <span>{note}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {confirmation && (
        <ConfirmModal
          title="Envoyer cette commande au livreur ?"
          message={`La commande #${ticketId} sera marquée « En livraison » et visible sous ce filtre jusqu'à sa livraison. Cette action ne peut pas être annulée.`}
          confirmLabel="Envoyer"
          tone="warning"
          icon="fa-motorcycle"
          onConfirm={() => {
            onTransition(confirmation.to)
            setConfirmation(null)
          }}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </article>
  )
}

function CoverPhoto({ src }) {
  const [broken, setBroken] = useState(false)
  if (broken || !src) {
    return (
      <span className="cuisine-row-line-photo-fallback">
        <i className="fa-solid fa-utensils" />
      </span>
    )
  }
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
}
