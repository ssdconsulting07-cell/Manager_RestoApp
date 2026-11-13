import { useEffect, useState } from 'react'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { imprimerTicket } from '../../components/ticket/impressionTicket.js'
import '../../components/ticket/ticket.css'
import { corpsBonLivraison, modeleBonLivraison, qrItineraireSvg } from './bonLivraison.js'

// Apercu a l'ecran du bon de livraison, avec bouton Imprimer — meme
// fonctionnement que le recu du Vendeur (ticket affiche, puis impression
// dans un onglet dedie). Utilise par la Cuisine (Commandes.jsx) et le
// Livreur (Livraisons.jsx).
export default function BonLivraison({ commande, produits, onFermer }) {
  const m = modeleBonLivraison(commande, produits)
  const [qr, setQr] = useState(null)

  useEffect(() => {
    let actif = true
    if (m.itineraire) qrItineraireSvg(m.itineraire).then((svg) => actif && setQr(svg))
    return () => {
      actif = false
    }
  }, [m.itineraire])

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onFermer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFermer])

  return (
    <div
      className="manager-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onFermer()}
    >
      <section className="manager-modal ticket-modal" role="dialog" aria-modal="true" aria-label={`${m.eyebrow} n° ${m.idTicket}`}>
        <div className="ticket">
          <header className="ticket-head">
            <p className="manager-eyebrow">{m.eyebrow}</p>
            <h2>Ticket n° {m.idTicket}</h2>
            <p className="ticket-meta">{m.meta}</p>
          </header>

          {m.client.length > 0 && (
            <div className="ticket-bloc">
              <p className="ticket-bloc-titre">Client</p>
              {m.client.map(([k, v]) => (
                <div key={k} className="ticket-info">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              {m.note && <p className="ticket-note">Note : {m.note}</p>}
            </div>
          )}

          <ul className="ticket-lignes">
            {m.lignes.map((l, i) => (
              <li key={i}>
                <span>
                  {l.texte}
                  {l.details.map((d) => (
                    <span key={d} className="ticket-ligne-detail">{d}</span>
                  ))}
                </span>
                {m.prixConnus && <span>{formatFCFA(l.montant)}</span>}
              </li>
            ))}
          </ul>

          <div className="ticket-totaux">
            {m.prixConnus && m.frais > 0 && (
              <>
                <div className="ticket-total-row">
                  <span>Sous-total</span>
                  <span>{formatFCFA(m.sousTotal)}</span>
                </div>
                <div className="ticket-total-row">
                  <span>Livraison</span>
                  <span>{formatFCFA(m.frais)}</span>
                </div>
              </>
            )}
            {m.prixConnus && m.total !== null && (
              <div className="ticket-total-row is-total">
                <span>Total</span>
                <strong>{formatFCFA(m.total)}</strong>
              </div>
            )}
            {m.paiement && (
              <div className="ticket-total-row">
                <span>Paiement</span>
                <span>
                  {m.paiement}
                  {m.paye && <> · <span className="ticket-paye">Payé</span></>}
                </span>
              </div>
            )}
          </div>

          {m.itineraire && (
            <div className="ticket-qr">
              {qr ? <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: qr }} /> : null}
              <p>
                Scanner pour l’itinéraire GPS ·{' '}
                <a href={m.itineraire} target="_blank" rel="noopener noreferrer">ouvrir</a>
              </p>
            </div>
          )}

          <p className="ticket-merci">Merci de votre commande — à bientôt chez SenYummies !</p>

          <div className="ticket-actions">
            <button
              type="button"
              className="manager-button manager-button-primary"
              onClick={() => imprimerTicket(`${m.eyebrow} n° ${m.idTicket}`, corpsBonLivraison(commande, produits))}
            >
              <i className="fa-solid fa-print" aria-hidden="true" /> Imprimer
            </button>
            <button type="button" className="manager-button manager-button-quiet" onClick={onFermer}>
              Fermer
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
