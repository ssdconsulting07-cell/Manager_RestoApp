// Export Excel (.xlsx) de l'historique de ventes du vendeur connecte, genere
// entierement cote navigateur avec SheetJS (meme pattern que
// exportJournalAudit.js) : aucun appel backend, tout reste mock. La
// librairie est chargee a la demande pour ne pas alourdir le chargement de
// l'application.
const EN_TETES = ['N° ticket', 'Heure', 'Articles', 'Total', 'Reçu', 'Monnaie rendue']

// Numero de serie Excel calcule sur l'heure LOCALE affichee a l'ecran : la
// cellule montre la meme heure que l'application, quel que soit le fuseau.
function serieExcel(date) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
  return (local - Date.UTC(1899, 11, 30)) / 86400000
}

function articlesTexte(vente) {
  return vente.lignes.map((l) => `${l.quantite}× ${l.nom}`).join(', ')
}

export async function exporterVentes({ ventes, nomFichier, vendeur }) {
  const XLSX = await import('xlsx')

  const lignes = ventes.map((v) => [
    v.numero,
    { t: 'n', v: serieExcel(new Date(v.createdAt)), z: 'dd/mm/yyyy hh:mm' },
    articlesTexte(v),
    v.total,
    v.montantRecu,
    v.monnaieRendue,
  ])
  const feuille = XLSX.utils.aoa_to_sheet([EN_TETES, ...lignes])
  feuille['!cols'] = [{ wch: 10 }, { wch: 17 }, { wch: 50 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
  feuille['!autofilter'] = { ref: `A1:F${lignes.length + 1}` }

  // Deuxieme onglet : ce qui a ete exporte, pour la tracabilite du fichier.
  const infos = XLSX.utils.aoa_to_sheet([
    ['Paramètre', 'Valeur'],
    ['Exporté le', { t: 'n', v: serieExcel(new Date()), z: 'dd/mm/yyyy hh:mm' }],
    ['Vendeur', vendeur],
    ['Nombre de ventes', lignes.length],
    ['Total encaissé', ventes.reduce((somme, v) => somme + v.total, 0)],
  ])
  infos['!cols'] = [{ wch: 18 }, { wch: 40 }]

  const classeur = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(classeur, feuille, 'Ventes')
  XLSX.utils.book_append_sheet(classeur, infos, 'Paramètres')
  XLSX.writeFile(classeur, nomFichier, { compression: true })
}
