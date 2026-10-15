import { useEffect, useMemo } from 'react'
import { allowedTransitions } from '../../auth/transitions.js'
import Layout from '../../components/Layout.jsx'
import PageSkeleton from '../../components/PageSkeleton.jsx'
import Toast from '../../components/Toast.jsx'
import CommandeRow from './CommandeRow.jsx'
import { jouerAlerteSonore } from './cuisineUtils.js'
import { useCuisineBoard } from './useCuisineBoard.js'
import './cuisine-board.css'

// Tableau unique du poste cuisine : les 3 etapes d'une commande (recue, en
// preparation, prete) restent visibles sur le meme ecran — retour
// utilisateur sur l'ancien decoupage en 2 pages (Commandes / Preparation) :
// il fallait changer d'ecran pour suivre un seul ticket jusqu'au bout, et
// une commande marquee prete disparaissait purement et simplement de la vue
// (aucun des 2 ecrans ne l'affichait). Objectif : un poste comprehensible
// et autonome, qui demande le moins de manipulation possible au personnel.
const COLONNES = [
  {
    statut: 'PAYEE',
    titre: 'Reçues',
    icon: 'fa-receipt',
    videTexte: 'Aucune commande en attente.',
  },
  {
    statut: 'EN_PREPARATION',
    titre: 'En préparation',
    icon: 'fa-fire-burner',
    videTexte: 'Poste libre.',
  },
  {
    statut: 'PRETE',
    titre: 'Prêtes',
    icon: 'fa-circle-check',
    videTexte: 'Rien de prêt pour l’instant.',
  },
]

export default function Commandes() {
  const {
    role,
    recues,
    enPreparation,
    pretes,
    produits,
    loading,
    error,
    demo,
    pendingId,
    nouvelleAlerte,
    charger,
    changerStatut,
    clearAlerte,
  } = useCuisineBoard()

  const parColonne = { PAYEE: recues, EN_PREPARATION: enPreparation, PRETE: pretes }

  // Toast + bip sonore sur une nouvelle commande payee (retour utilisateur :
  // le personnel ne doit pas avoir a fixer l'ecran en continu pour ne rien
  // manquer). nouvelleAlerte ne change d'identite que lorsqu'une nouvelle
  // commande arrive reellement (voir useCuisineBoard) : useMemo evite de
  // reconstruire un objet toast different a chaque re-rendu, ce qui aurait
  // sans cesse relance le minuteur d'auto-fermeture du Toast. Le bip est
  // joue a part, dans un useEffect (useMemo doit rester pur, sans effet de
  // bord — React peut l'invoquer plus d'une fois par rendu, ex. StrictMode).
  const toast = useMemo(() => {
    if (!nouvelleAlerte) return null
    const n = nouvelleAlerte.commandes.length
    return {
      id: nouvelleAlerte.at,
      type: 'info',
      message:
        n === 1
          ? `Nouvelle commande reçue — #${String(nouvelleAlerte.commandes[0].id).replace(/^demo-/, '')}`
          : `${n} nouvelles commandes reçues`,
    }
  }, [nouvelleAlerte])

  useEffect(() => {
    if (nouvelleAlerte) jouerAlerteSonore()
  }, [nouvelleAlerte])

  return (
    <Layout>
      <div className="cuisine-board-head">
        <div>
          <p className="manager-eyebrow">Cuisine{demo ? ' · démo' : ''}</p>
          <h1>Suivi des commandes</h1>
          <p>Du paiement au retrait, sur un seul écran.</p>
        </div>
        <div className="cuisine-board-tools">
          <button type="button" onClick={charger} className="cuisine-board-tool" aria-label="Actualiser">
            <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="cuisine-board-error">
          {error}
        </p>
      )}

      {loading ? (
        <PageSkeleton page="commandes" contentOnly />
      ) : (
        <div className="cuisine-board-columns">
          {COLONNES.map((colonne) => {
            const liste = parColonne[colonne.statut]
            return (
              <section key={colonne.statut} className="cuisine-board-column" aria-label={colonne.titre}>
                <header className="cuisine-board-column-head">
                  <span className="cuisine-board-column-title">
                    <i className={`fa-solid ${colonne.icon}`} aria-hidden="true" />
                    {colonne.titre}
                  </span>
                  <span className="cuisine-board-column-count">{liste.length}</span>
                </header>

                {liste.length === 0 ? (
                  <p className="cuisine-board-column-empty">{colonne.videTexte}</p>
                ) : (
                  <div className="cuisine-board-column-cards">
                    {liste.map((commande) => (
                      <CommandeRow
                        key={commande.id}
                        commande={commande}
                        produits={produits}
                        showDuree
                        transitions={allowedTransitions(commande, role)}
                        pending={pendingId === commande.id}
                        onTransition={(statut) => changerStatut(commande, statut)}
                        emptyActionLabel={colonne.statut === 'PRETE' ? 'En attente de retrait' : null}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <Toast toast={toast} onClose={clearAlerte} />
    </Layout>
  )
}
