import Layout from '../../components/Layout.jsx'
import StaffUserSection from '../../components/staff/StaffUserSection.jsx'

// Page Personnel cote Manager (24/10/2026, voir brainstorming-chez-ketchup.md) :
// deux sections sur une seule page plutot que deux sous-pages separees
// (cadrage par question fermee) -
//  - CRUD complet des comptes Gerant (le Manager est desormais le seul a
//    pouvoir creer/modifier/desactiver un compte Gerant).
//  - Vue en lecture seule des autres employes (Cuisine/Livreur/Vendeur),
//    toujours geres au quotidien par le Gerant (voir Personnel.jsx cote
//    Gerant) - le Manager consulte seulement, sans alerte temps reel, meme
//    logique que le reste de son espace (voir decision du 08/10/2026).
const ROLES_GERANTS = ['GERANT']
const ROLES_AUTRES_EMPLOYES = ['CUISINE', 'LIVREUR', 'VENDEUR']

export default function PersonnelManager() {
  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Pilotage</p>
          <h1>Personnel</h1>
          <p>Gérez les comptes Gérant et consultez le reste de l’équipe.</p>
        </div>
      </section>

      <StaffUserSection
        roles={ROLES_GERANTS}
        assignableRoles={ROLES_GERANTS}
        eyebrow="Gérants"
        title="Gérants"
        headingId="personnel-gerants-titre"
        description="Créez, modifiez ou désactivez les comptes Gérant."
        searchPlaceholder="Rechercher un gérant…"
        emptyLabel="Aucun compte Gérant pour le moment."
        createLabel="Créer un compte Gérant"
      />

      <StaffUserSection
        roles={ROLES_AUTRES_EMPLOYES}
        readOnly
        eyebrow="Équipe"
        title="Équipe (lecture seule)"
        headingId="personnel-equipe-titre"
        description="Cuisine, Livreurs et Vendeur sont gérés par le Gérant — vue de consultation uniquement."
        searchPlaceholder="Rechercher un employé…"
        emptyLabel="Aucun employé pour le moment."
      />
    </Layout>
  )
}
