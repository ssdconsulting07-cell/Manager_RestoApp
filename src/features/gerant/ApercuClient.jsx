import Layout from '../../components/Layout.jsx'
import AppClientPreview from './AppClientPreview.jsx'
import { useMenuData } from './MenuDataContext.jsx'
import { useAnnonces } from './AnnoncesContext.jsx'

export default function ApercuClient() {
  const { categories, produits } = useMenuData()
  const { annonceActive } = useAnnonces()

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Aperçu client</h1>
          <p>Visualisez le menu tel qu'il apparaît dans l'application client, à partir des catégories et produits publiés.</p>
        </div>
      </section>

      <AppClientPreview categories={categories} produits={produits} annonce={annonceActive} />
    </Layout>
  )
}
