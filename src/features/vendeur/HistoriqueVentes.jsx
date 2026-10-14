import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import Pagination from '../../components/crud/Pagination.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { formatFCFA } from '../../components/dashboard/DashboardWidgets.jsx'
import { nombreArticles, totalEncaisseDuJourDe, ventesDuJourDe } from './ventesData.js'
import { exporterVentes } from './exportVentes.js'
import Recu from './Recu.jsx'
import './vendeur-pos.css'

// Historique propre au vendeur connecte (poste de caisse individuel, voir
// decision du 13/10/2026) — pas une vue globale de toutes les ventes du
// restaurant. Recherche/pagination/export Excel au meme pattern que le
// Journal d'audit (Manager), adapte au perimetre plus simple des ventes : pas
// de date-range (perimetre deja limite a aujourd'hui), export immediat.
const ROWS_OPTIONS = [5, 10, 25]

function formatHeure(iso) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function correspond(vente, recherche) {
  const q = recherche.trim().toLowerCase()
  if (!q) return true
  if (String(vente.numero).includes(q)) return true
  return vente.lignes.some((l) => l.nom.toLowerCase().includes(q))
}

function nomFichierExport() {
  const d = new Date()
  const iso = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
  return `ventes-${iso}.xlsx`
}

export default function HistoriqueVentes() {
  const { username } = useAuth()
  const [venteOuverte, setVenteOuverte] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(ROWS_OPTIONS[0])
  const [exportEnCours, setExportEnCours] = useState(false)
  const [toast, setToast] = useState(null)

  const toutesLesVentes = ventesDuJourDe(username)
  const totalDuJour = totalEncaisseDuJourDe(username)

  const resultats = useMemo(
    () => toutesLesVentes.filter((v) => correspond(v, recherche)),
    [toutesLesVentes, recherche],
  )
  const pageCount = Math.max(1, Math.ceil(resultats.length / rows))
  const ventesPage = resultats.slice((page - 1) * rows, page * rows)
  const filtresActifs = recherche.trim() !== ''

  function changerRecherche(valeur) {
    setRecherche(valeur)
    setPage(1)
  }

  async function exporter() {
    if (!resultats.length || exportEnCours) return
    setExportEnCours(true)
    try {
      const nomFichier = nomFichierExport()
      await exporterVentes({ ventes: resultats, nomFichier, vendeur: username })
      setToast({ id: Date.now(), type: 'success', message: `${resultats.length} vente${resultats.length > 1 ? 's' : ''} exportée${resultats.length > 1 ? 's' : ''} dans « ${nomFichier} ».` })
    } catch {
      setToast({ id: Date.now(), type: 'error', message: 'L’export a échoué. Réessayez dans un instant.' })
    } finally {
      setExportEnCours(false)
    }
  }

  return (
    <Layout>
      <div className="vendeur-historique-head">
        <div>
          <p className="manager-eyebrow">Vendeur</p>
          <h1>Historique de mes ventes</h1>
          <p>Vos tickets encaissés aujourd’hui.</p>
        </div>
        <Link className="manager-button manager-button-primary" to="/vente">
          Nouvelle vente →
        </Link>
      </div>

      <div className="vendeur-historique-stats">
        <div className="vendeur-historique-stat">
          <span>Ventes aujourd’hui</span>
          <strong>{toutesLesVentes.length}</strong>
        </div>
        <div className="vendeur-historique-stat">
          <span>Total encaissé</span>
          <strong>{formatFCFA(totalDuJour)}</strong>
        </div>
      </div>

      <div className="crud-toolbar">
        <div className="crud-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            placeholder="N° de ticket ou produit…"
            aria-label="Rechercher une vente"
            value={recherche}
            onChange={(event) => changerRecherche(event.target.value)}
          />
        </div>
        <span className="crud-toolbar-spacer" />
        <button className="crud-add-button" type="button" onClick={exporter} disabled={!resultats.length || exportEnCours}>
          <i className="fa-solid fa-file-excel" aria-hidden="true" /> {exportEnCours ? 'Export…' : 'Exporter'}
        </button>
      </div>

      {resultats.length === 0 ? (
        <div className="crud-empty">
          <p>{toutesLesVentes.length === 0 ? 'Aucune vente encaissée pour l’instant aujourd’hui.' : 'Aucune vente ne correspond à cette recherche.'}</p>
          {filtresActifs && (
            <button className="manager-button manager-button-quiet" type="button" onClick={() => changerRecherche('')}>Réinitialiser la recherche</button>
          )}
        </div>
      ) : (
        <ul className="vendeur-historique-liste">
          {ventesPage.map((vente) => (
            <li key={vente.id}>
              <button type="button" className="vendeur-historique-ligne" onClick={() => setVenteOuverte(vente)}>
                <span className="vendeur-historique-numero">Ticket n° {vente.numero}</span>
                <span className="vendeur-historique-heure">{formatHeure(vente.createdAt)}</span>
                <span className="vendeur-historique-articles">{nombreArticles(vente)} article{nombreArticles(vente) > 1 ? 's' : ''}</span>
                <span className="vendeur-historique-total">{formatFCFA(vente.total)}</span>
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        rowsPerPage={rows}
        totalItems={resultats.length}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => { setRows(n); setPage(1) }}
        rowsOptions={ROWS_OPTIONS}
      />

      {venteOuverte && (
        <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setVenteOuverte(null)}>
          <section className="manager-modal" role="dialog" aria-modal="true" aria-label={`Reçu du ticket n° ${venteOuverte.numero}`}>
            <Recu vente={venteOuverte} vendeurLabel={username || 'Vendeur'} onFermer={() => setVenteOuverte(null)} />
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
