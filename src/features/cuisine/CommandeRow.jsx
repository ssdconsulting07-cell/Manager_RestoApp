import { useState } from 'react'
import {
  STATUT_META,
  formatDuree,
  formatHeure,
  modeLabel,
  nomProduit,
  noteCommande,
  photoProduit,
  resumePlats,
  textePersonnalisation,
} from './cuisineUtils.js'

const LABEL_COURT = {
  EN_PREPARATION: 'Commencer',
  PRETE: 'Marquer prête',
}

/** Ligne de commande cuisine, repliable — retour utilisateur : le ticket,
 * le badge de statut et le bouton d'action principal doivent se voir et se
 * faire d'un coup d'œil, sans avoir a ouvrir quoi que ce soit ; les plats
 * (avec leur photo), les personnalisations et la note client ne sont donc
 * affiches que si on deplie la ligne pour en voir le detail complet.
 *
 * showDuree est passe par tous les appelants desormais (tableau unique) : le
 * badge de retard (20 min) s'applique donc a n'importe quelle etape, pas
 * seulement en preparation comme avant — une commande prete oubliee 20 min
 * en attente de retrait est tout aussi digne d'etre signalee.
 * emptyActionLabel s'affiche a la place du bouton d'action quand transitions
 * est vide (etape "Prêtes" : CUISINE n'a aucune transition sortante depuis
 * PRETE, voir transitions.js) pour confirmer l'etat plutot que de laisser
 * un espace vide. */
export default function CommandeRow({
  commande,
  produits,
  transitions,
  pending,
  onTransition,
  showDuree = false,
  emptyActionLabel = null,
}) {
  const [deplie, setDeplie] = useState(false)
  const note = noteCommande(commande)
  const urgente = showDuree && Date.now() - new Date(commande.creeLe).getTime() > 20 * 60_000
  const enPreparation = commande.statut === 'EN_PREPARATION'
  const prete = commande.statut === 'PRETE'
  const lignes = commande.lignes || []
  const statutMeta = STATUT_META[commande.statut]
  const ticketId = String(commande.id).replace(/^demo-/, '')
  const detailsId = `commande-detail-${ticketId}`

  return (
    <article
      className={`cuisine-row${enPreparation ? ' is-prep' : ''}${prete ? ' is-ready' : ''}${urgente ? ' is-urgent' : ''}${deplie ? ' is-expanded' : ''}`}
    >
      <div className="cuisine-row-head">
        <div className="cuisine-row-top">
          <div className="cuisine-row-info">
            <span className="cuisine-row-id">#{ticketId}</span>
            {statutMeta && (
              <span
                className={`cuisine-row-status${enPreparation ? ' is-prep' : ''}${prete ? ' is-ready' : ''}`}
                style={{ '--status-accent': statutMeta.accent, '--status-bg': statutMeta.accentBg }}
              >
                <i className={`fa-solid ${statutMeta.icon}`} aria-hidden="true" />
                {statutMeta.label}
              </span>
            )}
            <span className="cuisine-row-pill">
              <i
                className={`fa-solid ${commande.mode === 'LIVRAISON' ? 'fa-motorcycle' : 'fa-bag-shopping'}`}
                aria-hidden="true"
              />
              {modeLabel(commande.mode)}
            </span>
            <span className={`cuisine-row-pill is-time${urgente ? ' is-late' : ''}`}>
              <i className="fa-solid fa-clock" aria-hidden="true" />
              {formatHeure(commande.creeLe)}
              {showDuree ? ` · ${formatDuree(commande.creeLe)}` : ''}
            </span>
            {urgente && <span className="cuisine-row-pill is-alert">Priorité</span>}
          </div>

          <div className="cuisine-row-primary">
            {transitions.length > 0 ? (
              transitions.map((t) => (
                <button
                  key={t.to}
                  type="button"
                  disabled={pending}
                  onClick={() => onTransition(t.to)}
                  className="manager-button manager-button-primary"
                >
                  {pending ? '…' : LABEL_COURT[t.to] || t.label}
                </button>
              ))
            ) : emptyActionLabel ? (
              <span className="cuisine-row-ready-note">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
                {emptyActionLabel}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className="cuisine-row-toggle"
            onClick={() => setDeplie((v) => !v)}
            aria-expanded={deplie}
            aria-controls={detailsId}
            aria-label={deplie ? `Masquer le détail de la commande ${ticketId}` : `Voir le détail de la commande ${ticketId}`}
          >
            <i className={`fa-solid ${deplie ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Toujours visible, meme repliee : retour utilisateur — sans ça,
            le personnel ne voit plus du tout quoi preparer sans deplier
            chaque ticket un par un en plein service. */}
        <p className="cuisine-row-summary">{resumePlats(lignes, produits)}</p>
      </div>

      {deplie && (
        <div className="cuisine-row-details" id={detailsId}>
          <ul className="cuisine-row-lines">
            {lignes.map((ligne, i) => {
              const perso = textePersonnalisation(ligne)
              return (
                <li key={i} className="cuisine-row-line">
                  <span className="cuisine-row-line-photo">
                    <CoverPhoto src={photoProduit(produits, ligne.produitId)} />
                    <span className="cuisine-row-line-qty">{ligne.quantite}×</span>
                  </span>
                  <div className="cuisine-row-line-copy">
                    <strong>{nomProduit(produits, ligne.produitId)}</strong>
                    {perso && <span>{perso}</span>}
                  </div>
                </li>
              )
            })}
          </ul>

          {note && (
            <div className="cuisine-row-note">
              <i className="fa-solid fa-comment" aria-hidden="true" />
              <span>{note}</span>
            </div>
          )}
        </div>
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
