// Journal d'audit — MOCK en memoire : aucun journal d'audit n'existe encore cote
// backend. Source unique du flux du tableau de bord Manager (apercu des
// dernieres actions) et de la page Journal d'audit (liste complete + export).
//
// Uniquement les actions metier du personnel (pas les connexions /
// deconnexions). Regles de coherence du mock :
// - les actions Personnel sont reservees aux Gerants (seul role ayant acces
//   a /personnel), jamais au Manager ;
// - le Manager n'agit que sur les commandes (annulations) ;
// - le role enregistre est celui de l'employe AU MOMENT de l'action
//   (Mariama Sy etait en Cuisine avant sa promotion en Gerant) ;
// - un employe n'apparait qu'apres la creation de son compte.
// Les horodatages sont relatifs au chargement de l'ecran pour que le journal
// reste "recent" en demo.
export const DOMAINES_AUDIT = {
  COMMANDE: { label: 'Commandes', icon: 'fa-receipt' },
  PRODUIT: { label: 'Produits', icon: 'fa-utensils' },
  CATEGORIE: { label: 'Catégories', icon: 'fa-tags' },
  ANNONCE: { label: 'Annonces', icon: 'fa-bullhorn' },
  PERSONNEL: { label: 'Personnel', icon: 'fa-user-gear' },
}

const ACTEURS = {
  awa: { nom: 'Awa Ndiaye', role: 'GERANT' },
  ousmane: { nom: 'Ousmane Kane', role: 'GERANT' },
  moussa: { nom: 'Moussa Diop', role: 'CUISINE' },
  aminata: { nom: 'Aminata Ba', role: 'CUISINE' },
  mariamaCuisine: { nom: 'Mariama Sy', role: 'CUISINE' },
  ibrahima: { nom: 'Ibrahima Fall', role: 'LIVREUR' },
  pape: { nom: 'Pape Gueye', role: 'LIVREUR' },
  fatou: { nom: 'Fatou Sarr', role: 'MANAGER' },
}

// Aujourd'hui : [minutes ecoulees, acteur, domaine, action]
const ENTREES_DU_JOUR = [
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

// Jours precedents : [jours avant aujourd'hui, heure, acteur, domaine, action]
const ENTREES_ANTERIEURES = [
  [1, '22:41', 'pape', 'COMMANDE', 'a marqué la commande #434 comme livrée'],
  [1, '21:58', 'aminata', 'COMMANDE', 'a marqué la commande #431 comme prête'],
  [1, '19:20', 'fatou', 'COMMANDE', 'a annulé la commande #418 : client injoignable'],
  [1, '16:05', 'ousmane', 'ANNONCE', 'a créé la chaîne d’annonces « Nouveautés du menu » en brouillon'],
  [1, '12:47', 'mariamaCuisine', 'COMMANDE', 'a passé la commande #401 en préparation'],
  [1, '11:10', 'awa', 'PRODUIT', 'a remis le produit « Jus de bissap » en stock'],
  [2, '22:15', 'ibrahima', 'COMMANDE', 'a marqué la commande #389 comme livrée'],
  [2, '20:32', 'moussa', 'COMMANDE', 'a marqué la commande #380 comme prête'],
  [2, '18:04', 'awa', 'PRODUIT', 'a créé le brouillon du produit « Thiebou Dieune »'],
  [2, '15:26', 'ousmane', 'PERSONNEL', 'a régénéré le mot de passe temporaire de Pape Gueye'],
  [2, '13:12', 'mariamaCuisine', 'COMMANDE', 'a passé la commande #358 en préparation'],
  [3, '21:47', 'pape', 'COMMANDE', 'a marqué la commande #343 comme livrée'],
  [3, '19:33', 'fatou', 'COMMANDE', 'a annulé la commande #331 : produit en rupture'],
  [3, '17:02', 'awa', 'CATEGORIE', 'a publié la catégorie « Plats du jour »'],
  [3, '14:40', 'aminata', 'COMMANDE', 'a marqué la commande #318 comme prête'],
  [3, '11:25', 'ousmane', 'PRODUIT', 'a mis le produit « Jus de bissap » en rupture'],
  [4, '22:08', 'ibrahima', 'COMMANDE', 'a marqué la commande #298 comme livrée'],
  [4, '20:15', 'moussa', 'COMMANDE', 'a passé la commande #289 en préparation'],
  [4, '16:48', 'awa', 'ANNONCE', 'a modifié l’annonce « Horaires spéciaux Tabaski »'],
  [4, '12:30', 'ousmane', 'PRODUIT', 'a modifié la photo du produit « Burger Poulet Croustillant »'],
  [5, '21:36', 'pape', 'COMMANDE', 'a marqué la commande #252 comme livrée'],
  [5, '19:05', 'mariamaCuisine', 'COMMANDE', 'a marqué la commande #244 comme prête'],
  [5, '18:20', 'fatou', 'COMMANDE', 'a annulé la commande #239 à la demande du client'],
  [5, '15:42', 'awa', 'PERSONNEL', 'a créé le compte livreur de Pape Gueye'],
  [5, '11:58', 'ousmane', 'CATEGORIE', 'a créé la catégorie « Desserts » en brouillon'],
  [6, '22:27', 'ibrahima', 'COMMANDE', 'a marqué la commande #208 comme livrée'],
  [6, '20:41', 'aminata', 'COMMANDE', 'a passé la commande #199 en préparation'],
  [6, '17:14', 'awa', 'PRODUIT', 'a publié le produit « Burger Poulet Croustillant »'],
  [6, '13:50', 'ousmane', 'ANNONCE', 'a publié l’annonce « Horaires spéciaux Tabaski »'],
  [7, '21:55', 'ibrahima', 'COMMANDE', 'a marqué la commande #163 comme livrée'],
  [7, '19:48', 'fatou', 'COMMANDE', 'a annulé la commande #151 : commande en double'],
  [7, '16:30', 'moussa', 'COMMANDE', 'a marqué la commande #139 comme prête'],
  [7, '12:06', 'awa', 'PERSONNEL', 'a désactivé le compte de Babacar Ndiaye'],
  [8, '22:19', 'ibrahima', 'COMMANDE', 'a marqué la commande #118 comme livrée'],
  [8, '18:37', 'aminata', 'COMMANDE', 'a marqué la commande #103 comme prête'],
  [8, '15:10', 'ousmane', 'PRODUIT', 'a modifié le prix de « Frites maison » : 1 200 → 1 500 F CFA'],
  [8, '11:44', 'awa', 'CATEGORIE', 'a modifié l’ordre d’affichage de la catégorie « Snacks »'],
  [9, '21:12', 'moussa', 'COMMANDE', 'a marqué la commande #71 comme prête'],
  [9, '18:26', 'fatou', 'COMMANDE', 'a annulé la commande #64 à la demande du client'],
  [9, '14:03', 'ousmane', 'PERSONNEL', 'a créé le compte cuisine d’Aminata Ba'],
  [9, '10:35', 'awa', 'ANNONCE', 'a archivé l’annonce « Promo Korité »'],
]

const chargeLe = new Date()

function dateAnterieure(jours, heure) {
  const [h, m] = heure.split(':').map(Number)
  const date = new Date(chargeLe)
  date.setDate(date.getDate() - jours)
  date.setHours(h, m, 0, 0)
  return date
}

// Du plus recent au plus ancien.
export const journalAudit = [
  ...ENTREES_DU_JOUR.map(([minutes, acteurId, domaine, action]) => (
    { acteurId, domaine, action, date: new Date(chargeLe.getTime() - minutes * 60000) }
  )),
  ...ENTREES_ANTERIEURES.map(([jours, heure, acteurId, domaine, action]) => (
    { acteurId, domaine, action, date: dateAnterieure(jours, heure) }
  )),
]
  .sort((a, b) => b.date - a.date)
  .map(({ acteurId, domaine, action, date }, i) => ({
    id: `audit-${i + 1}`,
    acteur: ACTEURS[acteurId],
    domaine,
    action,
    createdAt: date.toISOString(),
  }))
