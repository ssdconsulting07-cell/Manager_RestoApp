const PAGE_DETAILS = {
  preparation: {
    eyebrow: 'Cuisine',
    title: 'Préparation',
    description: 'L’espace de préparation détaillé sera disponible dans la prochaine étape.',
  },
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
  statistiques: {
    eyebrow: 'Manager',
    title: 'Statistiques',
    description: 'Les indicateurs financiers et opérationnels seront disponibles dans la prochaine étape.',
  },
}

function SkeletonBlock({ className = '' }) {
  return <span className={`page-skeleton-block ${className}`} />
}

function OrderCardsSkeleton() {
  return (
    <div className="page-skeleton-order-grid" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <article className="page-skeleton-order-card" key={index}>
          <div className="page-skeleton-order-heading">
            <SkeletonBlock className="is-order-number" />
            <SkeletonBlock className="is-order-time" />
          </div>
          <div className="page-skeleton-order-badges">
            <SkeletonBlock className="is-order-badge" />
            <SkeletonBlock className="is-order-badge is-secondary" />
          </div>
          <div className="page-skeleton-order-lines">
            <SkeletonBlock className="is-order-line" />
            <SkeletonBlock className="is-order-line is-short" />
            <SkeletonBlock className="is-order-line is-medium" />
          </div>
          <SkeletonBlock className="is-order-action" />
        </article>
      ))}
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
      ) : page === 'commandes' ? (
        <>
          {!contentOnly && (
            <div className="page-skeleton-page-heading" aria-hidden="true">
              <SkeletonBlock className="is-page-title" />
              <SkeletonBlock className="is-refresh-button" />
            </div>
          )}
          <OrderCardsSkeleton />
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