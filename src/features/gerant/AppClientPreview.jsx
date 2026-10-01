import AnnoncePopupPreview from './AnnoncePopupPreview.jsx'

export default function AppClientPreview({ categories, produits, annonce }) {
  const categoriesActives = categories
    .filter((c) => c.statut === 'ACTIF')
    .map((c) => ({ ...c, produitsActifs: produits.filter((p) => p.categorieId === c.id && p.statut === 'ACTIF') }))
    .filter((c) => c.produitsActifs.length > 0)

  return (
    <div>
      {annonce && (
        <AnnoncePopupPreview annonce={annonce} dismissible />
      )}
      {categoriesActives.length === 0 ? (
        <p className="crud-apercu-empty">
          Aucun produit publié pour le moment — le menu apparaîtra ici dès qu'une catégorie et des produits seront actifs.
        </p>
      ) : categoriesActives.map((categorie) => (
        <section className="crud-apercu-section" key={categorie.id}>
          <div className="crud-apercu-heading">
            <h2>{categorie.nom}</h2>
          </div>
          <div className="crud-apercu-grid">
            {categorie.produitsActifs.map((produit) => (
              <article className="crud-apercu-card" key={produit.id}>
                <div className="crud-apercu-photo">
                  {produit.photoUrl ? <img src={produit.photoUrl} alt="" /> : <i className="fa-solid fa-image" aria-hidden="true" />}
                  {produit.disponibilite === 'RUPTURE' && <span className="crud-apercu-rupture-badge">Indisponible</span>}
                </div>
                <div className="crud-apercu-body">
                  <h4>{produit.nom}</h4>
                  <strong>{produit.prix.toLocaleString('fr-FR')} F CFA</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
