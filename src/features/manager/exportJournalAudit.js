// Export Excel (.xlsx) du Journal d'audit, genere entierement cote navigateur
// avec SheetJS : aucun appel backend. La librairie est chargee a la demande
// pour ne pas alourdir le chargement de l'application.
import { lignesExport } from './journalAuditFiltres.js'

const EN_TETES = ['Date/heure', 'Employé', 'Rôle', 'Type d’action', 'Description']

// Numero de serie Excel calcule sur l'heure LOCALE affichee a l'ecran : la
// cellule montre la meme heure que l'application, quel que soit le fuseau.
function serieExcel(date) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
  return (local - Date.UTC(1899, 11, 30)) / 86400000
}

export async function exporterJournalAudit({ entrees, nomFichier, parametres }) {
  const XLSX = await import('xlsx')

  const lignes = lignesExport(entrees).map((l) => [
    { t: 'n', v: serieExcel(l.date), z: 'dd/mm/yyyy hh:mm' },
    l.employe, l.role, l.type, l.description,
  ])
  const journal = XLSX.utils.aoa_to_sheet([EN_TETES, ...lignes])
  journal['!cols'] = [{ wch: 17 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 70 }]
  journal['!autofilter'] = { ref: `A1:E${lignes.length + 1}` }

  // Deuxieme onglet : ce qui a ete exporte, pour la tracabilite du fichier.
  const infos = XLSX.utils.aoa_to_sheet([
    ['Paramètre', 'Valeur'],
    ['Exporté le', { t: 'n', v: serieExcel(new Date()), z: 'dd/mm/yyyy hh:mm' }],
    ['Période', parametres.periode],
    ['Rôle', parametres.role],
    ['Type d’action', parametres.domaine],
    ['Recherche', parametres.recherche],
    ['Nombre d’actions', lignes.length],
  ])
  infos['!cols'] = [{ wch: 18 }, { wch: 40 }]

  const classeur = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(classeur, journal, 'Journal d’audit')
  XLSX.utils.book_append_sheet(classeur, infos, 'Paramètres')
  XLSX.writeFile(classeur, nomFichier, { compression: true })
}
