import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import StaffUserSection from '../../components/staff/StaffUserSection.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import { apiGet } from '../../api/client.js'

// Page Personnel cote Manager (24/10/2026, voir brainstorming-chez-ketchup.md) :
// une seule page, deux groupes, bascules via deux cartes stats/filtre
// (Gerants / Autres) plutot que deux sections empilees avec chacune leur
// propre filtre Tous/Actifs/Desactives (retour utilisateur du 24/10/2026 -
// trop de cartes, redondant) :
//  - Gerants : CRUD complet (le Manager est desormais le seul a pouvoir
//    creer/modifier/desactiver un compte Gerant). Statut Actif/Desactive
//    affiche en badge cliquable sur la ligne (bascule directe), au lieu de
//    boutons Activer/Desactiver separes.
//  - Autres : lecture seule des autres employes (Cuisine/Livreur/Vendeur),
//    toujours geres au quotidien par le Gerant (voir Personnel.jsx cote
//    Gerant) - le Manager consulte seulement.
const ROLES_GERANTS = ['GERANT']
const ROLES_AUTRES_EMPLOYES = ['CUISINE', 'LIVREUR', 'VENDEUR']

const GROUPES = [
  { key: 'GERANTS', label: 'Gérants', icon: 'fa-user-tie', accent: '#17365d', accentBg: '#e5edf5' },
  { key: 'AUTRES', label: 'Autres', icon: 'fa-users', accent: '#1f6f57', accentBg: '#e2f2ec' },
]

export default function PersonnelManager() {
  const [groupe, setGroupe] = useState('GERANTS')
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    let actif = true
    apiGet('/staff-users')
      .then((data) => { if (actif) setAllUsers(data) })
      .catch(() => {})
    return () => { actif = false }
  }, [])

  const counts = useMemo(() => ({
    GERANTS: allUsers.filter((user) => ROLES_GERANTS.includes(user.role)).length,
    AUTRES: allUsers.filter((user) => ROLES_AUTRES_EMPLOYES.includes(user.role)).length,
  }), [allUsers])

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Pilotage</p>
          <h1>Personnel</h1>
          <p>Gérez les comptes Gérant et consultez le reste de l’équipe.</p>
        </div>
      </section>

      <StatFilterCards
        items={GROUPES.map((item) => ({ ...item, value: counts[item.key] }))}
        selected={groupe}
        onSelect={setGroupe}
        ariaLabel="Filtrer le personnel par groupe"
      />

      {groupe === 'GERANTS' ? (
        <StaffUserSection
          key="gerants"
          roles={ROLES_GERANTS}
          assignableRoles={ROLES_GERANTS}
          title="Gérants"
          headingId="personnel-gerants-titre"
          description="Créez, modifiez ou désactivez les comptes Gérant. Cliquez le badge de statut pour activer ou désactiver un compte."
          searchPlaceholder="Rechercher un gérant…"
          emptyLabel="Aucun compte Gérant pour le moment."
          createLabel="Créer un compte Gérant"
          hideStatusFilter
          compactStatusActions
        />
      ) : (
        <StaffUserSection
          key="autres"
          roles={ROLES_AUTRES_EMPLOYES}
          readOnly
          title="Équipe (lecture seule)"
          headingId="personnel-equipe-titre"
          description="Cuisine, Livreurs et Vendeur sont gérés par le Gérant — vue de consultation uniquement."
          searchPlaceholder="Rechercher un employé…"
          emptyLabel="Aucun employé pour le moment."
          hideStatusFilter
        />
      )}
    </Layout>
  )
}
