import { useState } from 'react'
import {
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

/** Carte ticket cuisine — photos des plats, note client, action de statut. */
export default function CommandeRow({ commande, produits, transitions, pending, onTransition, showDuree = false }) {
  const note = noteCommande(commande)
  const urgente = showDuree && Date.now() - new Date(commande.creeLe).getTime() > 20 * 60_000
  const lignes = commande.lignes || []
  const coverPhotos = lignes.slice(0, 3).map((l) => photoProduit(produits, l.produitId))

  return (
    <article className={`cuisine-card${showDuree ? ' is-prep' : ''}${urgente ? ' is-urgent' : ''}`}>
      <div className={`cuisine-card-cover cuisine-card-cover--${Math.min(coverPhotos.length, 3)}`} aria-hidden="true">
        {coverPhotos.map((src, i) => (
          <CoverPhoto key={i} src={src} />
        ))}
        <div className="cuisine-card-cover-shade" />
        <span className="cuisine-card-cover-id">#{String(commande.id).replace(/^demo-/, '')}</span>
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
                <span className="cuisine-card-qty-badge">{ligne.quantite}×</span>
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
          {transitions.map((t) => (
            <button
              key={t.to}
              type="button"
              disabled={pending}
              onClick={() => onTransition(t.to)}
              className="manager-button manager-button-primary"
            >
              {pending ? '…' : LABEL_COURT[t.to] || t.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

function CoverPhoto({ src }) {
  const [broken, setBroken] = useState(false)
  if (broken || !src) {
    return (
      <span className="cuisine-card-cover-fallback">
        <i className="fa-solid fa-utensils" />
      </span>
    )
  }
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
}
