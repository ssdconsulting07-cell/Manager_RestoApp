// Importe ici (pas seulement dans Commandes.jsx) parce que PageSkeleton est
// charge dans le bundle principal (voir App.jsx, qui l'affiche comme
// fallback de Suspense), alors que Commandes.jsx est charge a la demande
// (lazy). Sans cet import, le squelette de lignes ci-dessous (qui reutilise
// les classes cuisine-row-*) s'affichait sans aucune mise en forme au tout
// premier chargement de la page Commandes, le temps que son propre bundle
// (et donc ce CSS) arrive (releve agent local). Poids modeste (7,6 kB, 1,8
// kB compresse) et classes toutes prefixees cuisine-, donc sans effet sur
// les autres pages qui utilisent aussi PageSkeleton.
import '../features/cuisine/cuisine-board.css'

const PAGE_DETAILS = {
  produits: {
    eyebrow: 'Gérance',
    title: 'Produits',
    description: 'La gestion des produits sera disponible dans la prochaine étape.',
  },
  categories: {
    eyebrow: 'Gérance',
    title: 'Catégories',
    description: 'La gestion des catégories sera disponible dans la prochaine étape.',
  },
  livraisons: {
    eyebrow: 'Livraison',
    title: 'Livraisons',
    description: 'Le suivi des tournées et des commandes à livrer sera disponible dans la prochaine étape.',
  },
  personnel: {
    eyebrow: 'Manager',
    title: 'Personnel',
    description: 'La gestion des membres de l’équipe sera disponible dans la prochaine étape.',
  },
  'journal-audit': {
    eyebrow: 'Traçabilité',
    title: 'Journal d’audit',
    description: 'Toutes les actions du personnel, en consultation seule.',
  },
  'historique-ventes': {
    eyebrow: 'Vendeur',
    title: 'Historique de mes ventes',
    description: 'Vos tickets encaissés aujourd’hui.',
  },
}

function SkeletonBlock({ className = '' }) {
  return <span className={`page-skeleton-block ${className}`} />
}

// Lignes de commande squelette (tableau cuisine) : calquees sur la vraie
// structure d'une ligne (cuisine-row / cuisine-row-head / ..., voir
// CommandeRow.jsx) plutot que sur une grille de cartes — l'ancienne version
// (page-skeleton-order-*, retiree) datait du design en cartes d'avant le
// passage au tableau a lignes, et ne correspondait plus du tout a ce qui
// s'affiche une fois charge. Exportee a part (pas seulement via
// PageSkeleton) : Commandes.jsx la reutilise aussi pour le changement de
// carte-filtre et le rafraichissement manuel (retour utilisateur : "je veux
// des squelettes" sur ces trois cas), pas seulement le tout premier
// chargement.
export function CommandeRowsSkeleton({ count = 4 }) {
  return (
    <div className="crud-list" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <article className="cuisine-row page-skeleton-row" key={index}>
          <div className="cuisine-row-head">
            <div className="cuisine-row-top">
              <div className="cuisine-row-info">
                <SkeletonBlock className="is-row-id" />
                <SkeletonBlock className="is-row-pill" />
                <SkeletonBlock className="is-row-pill is-row-pill-wide" />
                <SkeletonBlock className="is-row-pill" />
              </div>
              <div className="cuisine-row-primary">
                <SkeletonBlock className="is-row-action" />
              </div>
              <SkeletonBlock className="is-row-toggle" />
            </div>
            <SkeletonBlock className="is-row-summary" />
          </div>
        </article>
      ))}
    </div>
  )
}

function PosSkeleton() {
  return (
    <div className="page-skeleton-pos" aria-hidden="true">
      <div className="page-skeleton-pos-catalogue">
        <div className="page-skeleton-pos-tabs">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock className="is-pos-tab" key={index} />
          ))}
        </div>
        <div className="page-skeleton-pos-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <article className="page-skeleton-pos-card" key={index}>
              <SkeletonBlock className="is-pos-photo" />
              <div className="page-skeleton-pos-card-body">
                <SkeletonBlock className="is-pos-card-title" />
                <SkeletonBlock className="is-pos-card-price" />
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside className="page-skeleton-pos-panier">
        <SkeletonBlock className="is-pos-panier-heading" />
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonBlock className="is-pos-panier-line" key={index} />
        ))}
        <SkeletonBlock className="is-pos-panier-total" />
        <SkeletonBlock className="is-pos-panier-action" />
      </aside>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="page-skeleton-dashboard" aria-hidden="true">
      <section className="page-skeleton-dashboard-intro">
        <div>
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-dashboard-title" />
          <SkeletonBlock className="is-dashboard-description" />
        </div>
        <SkeletonBlock className="is-role-badge" />
      </section>

      <section className="page-skeleton-stat-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <article className="page-skeleton-stat-card" key={index}>
            <div className="page-skeleton-stat-heading">
              <SkeletonBlock className="is-stat-label" />
              <SkeletonBlock className="is-stat-tag" />
            </div>
            <div className="page-skeleton-stat-value">
              <SkeletonBlock className="is-stat-number" />
              <SkeletonBlock className="is-stat-detail" />
            </div>
          </article>
        ))}
      </section>

      <section className="page-skeleton-lower-grid">
        <article className="page-skeleton-panel">
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-panel-title" />
          <SkeletonBlock className="is-panel-copy" />
          <SkeletonBlock className="is-panel-action" />
        </article>
        <article className="page-skeleton-panel is-muted">
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-panel-title is-title-short" />
          <SkeletonBlock className="is-panel-copy" />
        </article>
      </section>
    </div>
  )
}

export default function PageSkeleton({ page, contentOnly = false }) {
  return (
    <section className={`page-skeleton page-skeleton-${page}`} role="status" aria-busy="true">
      <span className="page-skeleton-announcement">Chargement de la page…</span>
      {page === 'dashboard' ? (
        <DashboardSkeleton />
      ) : page === 'vente' ? (
        <PosSkeleton />
      ) : page === 'commandes' ? (
        <>
          {!contentOnly && (
            <div className="page-skeleton-page-heading" aria-hidden="true">
              <SkeletonBlock className="is-page-title" />
              <SkeletonBlock className="is-refresh-button" />
            </div>
          )}
          <CommandeRowsSkeleton />
        </>
      ) : (
        <div className="dashboard-panel page-skeleton-placeholder" aria-hidden="true">
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-placeholder-title" />
          <SkeletonBlock className="is-placeholder-copy" />
          <span className="page-skeleton-placeholder-label">{PAGE_DETAILS[page]?.title}</span>
        </div>
      )}
    </section>
  )
}
