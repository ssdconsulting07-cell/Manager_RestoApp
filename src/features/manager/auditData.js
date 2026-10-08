// Journal d'audit — MOCK en memoire : aucun journal d'audit n'existe encore cote
// backend. Uniquement les actions metier du personnel (pas les connexions /
// deconnexions), sur les 4 roles. Les horodatages sont relatifs au chargement
// de l'ecran pour que le flux reste "recent" en demo.
export const DOMAINES_AUDIT = {
  COMMANDE: { label: 'Commandes', icon: 'fa-receipt' },
  PRODUIT: { label: 'Produits', icon: 'fa-utensils' },
  CATEGORIE: { label: 'Catégories', icon: 'fa-tags' },
  ANNONCE: { label: 'Annonces', icon: 'fa-bullhorn' },
  PERSONNEL: { label: 'Personnel', icon: 'fa-user-gear' },
}

const ACTEURS = {
  awa: { nom: 'Awa Ndiaye', role: 'GERANT' },
  moussa: { nom: 'Moussa Diop', role: 'CUISINE' },
  ibrahima: { nom: 'Ibrahima Fall', role: 'LIVREUR' },
  fatou: { nom: 'Fatou Sarr', role: 'MANAGER' },
}

// [minutes ecoulees, acteur, domaine, action]
const ENTREES = [
  [3, 'moussa', 'COMMANDE', 'a passé la commande #482 en préparation'],
  [7, 'ibrahima', 'COMMANDE', 'a marqué la commande #476 comme livrée'],
  [12, 'awa', 'PRODUIT', 'a publié le produit « Thiebou Dieune »'],
  [18, 'moussa', 'COMMANDE', 'a marqué la commande #479 comme prête'],
  [26, 'awa', 'PRODUIT', 'a mis le produit « Frites maison » en rupture'],
  [41, 'awa', 'PERSONNEL', 'a créé le compte livreur de Cheikh Ba'],
  [58, 'awa', 'PRODUIT', 'a modifié le prix de « Double Ketchup Burger » : 3 500 → 3 800 F CFA'],
  [84, 'fatou', 'COMMANDE', 'a annulé la commande #471 à la demande du client'],
  [125, 'awa', 'ANNONCE', 'a activé la chaîne d’annonces « Nouveautés du menu »'],
  [190, 'awa', 'CATEGORIE', 'a renommé la catégorie « Snacks » en « Accompagnements »'],
  [260, 'awa', 'PERSONNEL', 'a modifié le rôle de Mariama Sy : Cuisine → Gérant'],
  [1500, 'awa', 'ANNONCE', 'a archivé l’annonce « Ancienne offre de lancement »'],
]

const chargeLe = Date.now()

export const journalAudit = ENTREES.map(([minutes, acteurId, domaine, action], i) => ({
  id: `audit-${i + 1}`,
  acteur: ACTEURS[acteurId],
  domaine,
  action,
  createdAt: new Date(chargeLe - minutes * 60000).toISOString(),
}))
