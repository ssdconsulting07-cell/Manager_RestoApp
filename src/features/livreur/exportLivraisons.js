// Export Excel (.xlsx) de l'Historique des livraisons, genere entierement
// cote navigateur avec SheetJS : aucun appel backend (meme principe que
// exportJournalAudit.js, cote Manager). La librairie est chargee a la
// demande pour ne pas alourdir le chargement de l'application.
import { lignesExport } from './livraisonsFiltres.js'

const EN_TETES = ['Date/heure de livraison', 'Ticket', 'Produits', 'Canal', 'Mode', 'Note']

// Numero de serie Excel calcule sur l'heure LOCALE affichee a l'ecran : la
// cellule montre la meme heure que l'application, quel que soit le fuseau.
function serieExcel(date) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
  return (local - Date.UTC(1899, 11, 30)) / 86400000
}

export async function exporterLivraisons({ livrees, produits, nomFichier, parametres }) {
  const XLSX = await import('xlsx')

  const lignes = lignesExport(livrees, produits).map((l) => [
    { t: 'n', v: serieExcel(l.date), z: 'dd/mm/yyyy hh:mm' },
    `#${l.ticket}`, l.produits, l.canal, l.mode, l.note,
  ])
  const historique = XLSX.utils.aoa_to_sheet([EN_TETES, ...lignes])
  historique['!cols'] = [{ wch: 19 }, { wch: 10 }, { wch: 45 }, { wch: 10 }, { wch: 10 }, { wch: 30 }]
  historique['!autofilter'] = { ref: `A1:F${lignes.length + 1}` }

  // Deuxieme onglet : ce qui a ete exporte, pour la tracabilite du fichier.
  const infos = XLSX.utils.aoa_to_sheet([
    ['Paramètre', 'Valeur'],
    ['Exporté le', { t: 'n', v: serieExcel(new Date()), z: 'dd/mm/yyyy hh:mm' }],
    ['Période', parametres.periode],
    ['Recherche', parametres.recherche],
    ['Nombre de livraisons', lignes.length],
  ])
  infos['!cols'] = [{ wch: 18 }, { wch: 40 }]

  const classeur = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(classeur, historique, 'Historique livraisons')
  XLSX.utils.book_append_sheet(classeur, infos, 'Paramètres')
  XLSX.writeFile(classeur, nomFichier, { compression: true })
}
