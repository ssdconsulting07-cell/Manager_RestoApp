import Layout from '../../components/Layout.jsx'
import StaffUserSection from '../../components/staff/StaffUserSection.jsx'

// Le Gerant gere ici uniquement Cuisine/Livreur/Vendeur - ni le Manager
// (deja exclu avant ce chantier), ni les autres comptes Gerant (exclusion
// ajoutee le 24/10/2026, voir brainstorming-chez-ketchup.md) : c'est
// desormais le Manager qui gere les comptes Gerant, sur sa propre page
// (voir features/manager/PersonnelManager.jsx).
const ROLES_GERES_PAR_GERANT = ['CUISINE', 'LIVREUR', 'VENDEUR']

export default function Personnel() {
  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Utilisateurs</h1>
          <p>Gérez les accès, les rôles et les mots de passe de la Cuisine, des Livreurs et du Vendeur.</p>
        </div>
      </section>

      <StaffUserSection
        roles={ROLES_GERES_PAR_GERANT}
        assignableRoles={ROLES_GERES_PAR_GERANT}
        eyebrow="Gestion du personnel"
        searchPlaceholder="Rechercher un nom, identifiant ou rôle…"
        emptyLabel="Aucun membre du personnel correspondant."
      />
    </Layout>
  )
}
