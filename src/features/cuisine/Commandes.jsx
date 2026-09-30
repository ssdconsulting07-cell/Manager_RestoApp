import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPatch } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { allowedTransitions, STATUT_LABELS } from '../../auth/transitions.js'
import Layout from '../../components/Layout.jsx'
import PageSkeleton from '../../components/PageSkeleton.jsx'
import { colors, fontFamily } from '../../theme.js'

// Ecran Cuisine : commandes payees (recues) et en preparation, dans l'ordre d'arrivee.
// Une commande passee a PRETE quitte cette liste.
const STATUTS_ACTIFS = ['PAYEE', 'EN_PREPARATION']

// En attendant les notifications temps reel (WebSocket / SSE cote backend),
// la liste est rafraichie periodiquement.
const REFRESH_MS = 15000

function commandesActives(commandes) {
  return commandes
    .filter((c) => STATUTS_ACTIFS.includes(c.statut))
    .sort((a, b) => new Date(a.creeLe) - new Date(b.creeLe))
}

function formatHeure(iso) {
  return iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
}

export default function Commandes() {
  const { role } = useAuth()
  const [commandes, setCommandes] = useState([])
  const [produits, setProduits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  // Incremente a chaque changement de statut : un rafraichissement lance avant
  // ne doit pas ecraser l'etat plus recent renvoye par le PATCH.
  const mutationVersion = useRef(0)

  const charger = useCallback(async () => {
    const version = mutationVersion.current
    try {
      const data = await apiGet('/commandes')
      if (version !== mutationVersion.current) return
      setCommandes(commandesActives(data))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    charger()
    const timer = setInterval(charger, REFRESH_MS)
    return () => clearInterval(timer)
  }, [charger])

  // Le contrat ne renvoie que produitId dans les lignes : on resout les noms via le menu.
  useEffect(() => {
    apiGet('/produits')
      .then((liste) => setProduits(Object.fromEntries(liste.map((p) => [p.id, p.nom]))))
      .catch(() => {})
  }, [])

  async function changerStatut(commande, statut) {
    setPendingId(commande.id)
    setError(null)
    try {
      const maj = await apiPatch(`/commandes/${commande.id}/statut`, { statut })
      mutationVersion.current += 1
      setCommandes((prev) => commandesActives(prev.map((c) => (c.id === commande.id ? maj : c))))
    } catch (err) {
      setError(
        err.status === 403
          ? `Action refusée : votre rôle ne permet pas de passer cette commande au statut « ${STATUT_LABELS[statut]} ».`
          : err.message,
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: '0 0 16px' }}>Commandes à préparer</h1>
        <button type="button" onClick={charger} style={secondaryButton}>
          Actualiser
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: colors.red, margin: '0 0 16px' }}>
          {error}
        </p>
      )}

      {loading ? (
        <PageSkeleton page="commandes" contentOnly />
      ) : commandes.length === 0 ? (
        <p style={{ color: colors.gray600 }}>Aucune commande en attente.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {commandes.map((commande) => (
            <CarteCommande
              key={commande.id}
              commande={commande}
              produits={produits}
              transitions={allowedTransitions(commande, role)}
              pending={pendingId === commande.id}
              onTransition={(statut) => changerStatut(commande, statut)}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}

function CarteCommande({ commande, produits, transitions, pending, onTransition }) {
  const enPreparation = commande.statut === 'EN_PREPARATION'

  return (
    <article
      style={{
        background: colors.white,
        borderRadius: 10,
        padding: 16,
        borderTop: `4px solid ${enPreparation ? colors.black : colors.red}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>#{commande.id}</strong>
        <span style={{ color: colors.gray600, fontSize: 14 }}>{formatHeure(commande.creeLe)}</span>
      </header>

      <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
        <span style={badge(enPreparation ? colors.black : colors.red)}>{STATUT_LABELS[commande.statut]}</span>
        <span style={badge(colors.gray600)}>{commande.mode === 'LIVRAISON' ? 'Livraison' : 'Retrait'}</span>
      </div>

      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {(commande.lignes || []).map((ligne, i) => (
          <li key={i}>
            <strong>{ligne.quantite} ×</strong> {produits[ligne.produitId] || `Produit ${ligne.produitId}`}
          </li>
        ))}
      </ul>

      {transitions.map((t) => (
        <button
          key={t.to}
          type="button"
          disabled={pending}
          onClick={() => onTransition(t.to)}
          style={{
            padding: '10px',
            background: colors.red,
            color: colors.white,
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontFamily,
            cursor: pending ? 'wait' : 'pointer',
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Mise à jour…' : t.label}
        </button>
      ))}
    </article>
  )
}

const secondaryButton = {
  background: colors.white,
  border: `1px solid ${colors.gray200}`,
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  fontFamily,
}

function badge(color) {
  return {
    color: colors.white,
    background: color,
    borderRadius: 4,
    padding: '2px 8px',
  }
}
