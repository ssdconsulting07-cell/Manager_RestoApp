import { useState } from 'react'
import {
  STATUT_META,
  formatDuree,
  formatHeure,
  modeLabel,
  nomProduit,
  noteCommande,
  photoProduit,
  textePersonnalisation,
} from './cuisineUtils.js'

const LABEL_COURT = {
  EN_PREPARATION: 'Commencer',
  PRETE: 'Marquer prête',
}

/** Carte ticket cuisine — numero de ticket et statut en tete, en texte net
 * (plus en overlay sur une photo, illisible selon le plat), une photo par
 * plat au lieu d'une collette ambigue en haut de carte quand il y a
 * plusieurs plats differents, note client, action de statut.
 *
 * showDuree est passe par tous les appelants desormais (tableau unique) : le
 * badge de retard (20 min) s'applique donc a n'importe quelle etape, pas
 * seulement en preparation comme avant — une commande prete oubliee 20 min
 * en attente de retrait est tout aussi digne d'etre signalee.
 * emptyActionLabel s'affiche a la place des actions quand transitions est
 * vide (etape "Prêtes" : CUISINE n'a aucune transition sortante depuis
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
  const note = noteCommande(commande)
  const urgente = showDuree && Date.now() - new Date(commande.creeLe).getTime() > 20 * 60_000
  const enPreparation = commande.statut === 'EN_PREPARATION'
  const prete = commande.statut === 'PRETE'
  const lignes = commande.lignes || []
  const statutMeta = STATUT_META[commande.statut]

  return (
    <article
      className={`cuisine-card${enPreparation ? ' is-prep' : ''}${prete ? ' is-ready' : ''}${urgente ? ' is-urgent' : ''}`}
    >
      <div className="cuisine-card-head">
        <span className="cuisine-card-id">#{String(commande.id).replace(/^demo-/, '')}</span>
        {statutMeta && (
          <span
            className={`cuisine-card-status${enPreparation ? ' is-prep' : ''}${prete ? ' is-ready' : ''}`}
            style={{ '--status-accent': statutMeta.accent, '--status-bg': statutMeta.accentBg }}
          >
            <i className={`fa-solid ${statutMeta.icon}`} aria-hidden="true" />
            {statutMeta.label}
          </span>
        )}
      </div>

      <div className="cuisine-card-body">
        <div className="cuisine-card-meta">
          <span className="cuisine-card-pill">
            <i
              className={`fa-solid ${commande.mode === 'LIVRAISON' ? 'fa-motorcycle' : 'fa-bag-shopping'}`}
              aria-hidden="true"
            />
            {modeLabel(commande.mode)}
          </span>
          <span className={`cuisine-card-pill is-time${urgente ? ' is-late' : ''}`}>
            <i className="fa-solid fa-clock" aria-hidden="true" />
            {formatHeure(commande.creeLe)}
            {showDuree ? ` · ${formatDuree(commande.creeLe)}` : ''}
          </span>
          {urgente && <span className="cuisine-card-pill is-alert">Priorité</span>}
        </div>

        <ul className="cuisine-card-lines">
          {lignes.map((ligne, i) => {
            const perso = textePersonnalisation(ligne)
            return (
              <li key={i} className="cuisine-card-line">
                <span className="cuisine-card-line-photo">
                  <CoverPhoto src={photoProduit(produits, ligne.produitId)} />
                  <span className="cuisine-card-line-qty">{ligne.quantite}×</span>
                </span>
                <div className="cuisine-card-line-copy">
                  <strong>{nomProduit(produits, ligne.produitId)}</strong>
                  {perso && <span>{perso}</span>}
                </div>
              </li>
            )
          })}
        </ul>

        {note && (
          <div className="cuisine-card-note">
            <i className="fa-solid fa-comment" aria-hidden="true" />
            <span>{note}</span>
          </div>
        )}

        <div className="cuisine-card-actions">
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
            <span className="cuisine-card-ready-note">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              {emptyActionLabel}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function CoverPhoto({ src }) {
  const [broken, setBroken] = useState(false)
  if (broken || !src) {
    return (
      <span className="cuisine-card-line-photo-fallback">
        <i className="fa-solid fa-utensils" />
      </span>
    )
  }
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
}
