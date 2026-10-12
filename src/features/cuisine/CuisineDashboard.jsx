import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../../api/client.js'
import Layout from '../../components/Layout.jsx'
import { avecDemoSiVide, mergeProduitsDemo } from './cuisineDemo.js'
import { filtrerParStatuts, formatHeure, mapProduitsParId, nomProduit, photoProduit } from './cuisineUtils.js'
import './cuisine-dashboard.css'

const CARDS = [
  {
    key: 'recues',
    label: 'À démarrer',
    detail: 'Payées — file d’attente',
    cta: 'Ouvrir la file',
    path: '/commandes',
    icon: 'fa-receipt',
    tone: 'urgent',
  },
  {
    key: 'enCours',
    label: 'En préparation',
    detail: 'Tickets au poste',
    cta: 'Voir le poste',
    path: '/preparation',
    icon: 'fa-fire-burner',
    tone: 'active',
  },
  {
    key: 'pretes',
    label: 'Prêtes',
    detail: 'Client ou livreur',
    cta: 'Voir le flux',
    path: '/preparation',
    icon: 'fa-circle-check',
    tone: 'done',
  },
]

function compter(commandes) {
  const counts = { recues: 0, enCours: 0, pretes: 0 }
  for (const c of commandes || []) {
    if (c.statut === 'PAYEE') counts.recues += 1
    else if (c.statut === 'EN_PREPARATION') counts.enCours += 1
    else if (c.statut === 'PRETE') counts.pretes += 1
  }
  return counts
}

export default function CuisineDashboard() {
  const [counts, setCounts] = useState({ recues: 0, enCours: 0, pretes: 0 })
  const [apercu, setApercu] = useState([])
  const [produits, setProduits] = useState({})
  const [demo, setDemo] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([apiGet('/commandes').catch(() => []), apiGet('/produits').catch(() => [])]).then(
      ([listeApi, produitsApi]) => {
        if (cancelled) return
        const { commandes, demo: isDemo } = avecDemoSiVide(listeApi)
        setProduits(mergeProduitsDemo(mapProduitsParId(produitsApi)))
        setCounts(compter(commandes))
        setApercu(filtrerParStatuts(commandes, ['PAYEE', 'EN_PREPARATION']).slice(0, 4))
        setDemo(isDemo)
        setLoaded(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const totalActif = counts.recues + counts.enCours
  const nextPath = counts.recues > 0 ? '/commandes' : '/preparation'

  return (
    <Layout>
      <section className="cuisine-dash">
        <header className="cuisine-dash-hero">
          <div className="cuisine-dash-hero-copy">
            <p className="manager-eyebrow">Service en cours{demo ? ' · démo' : ''}</p>
            <h1>Bonjour, équipe Cuisine.</h1>
            <p>
              {!loaded
                ? 'Chargement du poste…'
                : totalActif > 0
                  ? `${totalActif} commande${totalActif > 1 ? 's' : ''} à suivre — reçue → préparation → prête.`
                  : 'Poste libre — les commandes payées apparaîtront ici.'}
            </p>
            <div className="cuisine-dash-hero-actions">
              <Link className="manager-button manager-button-primary" to={nextPath}>
                {counts.recues > 0 ? 'Traiter la file' : 'Ouvrir le poste'} →
              </Link>
              <span className="dashboard-role-badge">Cuisine</span>
            </div>
          </div>
          <div className="cuisine-dash-hero-visual" aria-hidden="true">
            <i className="fa-solid fa-kitchen-set" />
          </div>
        </header>

        <section className="cuisine-dash-cards" aria-label="Résumé cuisine">
          {CARDS.map((card) => {
            const value = counts[card.key]
            return (
              <Link
                key={card.key}
                to={card.path}
                className={`cuisine-dash-card cuisine-dash-card--${card.tone}${card.key === 'recues' && value > 0 ? ' is-hot' : ''}`}
              >
                <div className="cuisine-dash-card-top">
                  <span className="cuisine-dash-card-icon" aria-hidden="true">
                    <i className={`fa-solid ${card.icon}`} />
                  </span>
                  <span className="cuisine-dash-card-label">{card.label}</span>
                </div>
                <div className="cuisine-dash-card-value">
                  <strong>{loaded ? value : '—'}</strong>
                  <span>{card.detail}</span>
                </div>
                <span className="cuisine-dash-card-cta">
                  {card.cta}
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </section>

        {apercu.length > 0 && (
          <section className="cuisine-dash-preview" aria-label="Prochains tickets">
            <div className="cuisine-dash-preview-head">
              <div>
                <p className="manager-eyebrow">Tickets à venir</p>
                <h2>Ce que la cuisine reçoit</h2>
              </div>
              <Link to="/commandes" className="cuisine-dash-preview-link">
                Tout voir →
              </Link>
            </div>
            <div className="cuisine-dash-preview-grid">
              {apercu.map((c) => {
                const first = c.lignes?.[0]
                const thumb = first ? photoProduit(produits, first.produitId) : null
                return (
                  <Link
                    key={c.id}
                    to={c.statut === 'EN_PREPARATION' ? '/preparation' : '/commandes'}
                    className={`cuisine-dash-ticket${c.statut === 'EN_PREPARATION' ? ' is-prep' : ''}`}
                  >
                    <div className="cuisine-dash-ticket-media" aria-hidden="true">
                      {thumb ? <img src={thumb} alt="" loading="lazy" /> : <i className="fa-solid fa-utensils" />}
                    </div>
                    <div className="cuisine-dash-ticket-copy">
                      <strong>#{String(c.id).replace(/^demo-/, '')}</strong>
                      <span>
                        {first
                          ? `${first.quantite}× ${nomProduit(produits, first.produitId)}`
                          : 'Sans lignes'}
                        {(c.lignes?.length || 0) > 1 ? ` +${c.lignes.length - 1}` : ''}
                      </span>
                      <small>
                        {c.statut === 'EN_PREPARATION' ? 'En préparation' : 'Reçue'} · {formatHeure(c.creeLe)}
                      </small>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </section>
    </Layout>
  )
}
