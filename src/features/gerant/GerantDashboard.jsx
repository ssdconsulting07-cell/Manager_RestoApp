import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useMenuData } from './MenuDataContext.jsx'
import { useAnnonces } from './AnnoncesContext.jsx'
import { STATUT_LABELS, countByStatut } from './menuData.js'

// Tableau de bord Gérant — construit uniquement avec les données déjà
// disponibles dans le périmètre Gérant (Produits/Catégories/Annonces,
// toujours mock pour l'instant). Volontairement aucune donnée Commandes/CA,
// qui relève des équipes Cuisine/Manager et n'existe pas encore côté Backend.
const STATUT_CHART_COLORS = {
  ACTIF: 'var(--chart-green)',
  BROUILLON: 'var(--chart-amber)',
  ARCHIVE: 'var(--chart-gray)',
}

function formatRelativeTime(timestamp) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'à l’instant'
  if (elapsedMinutes < 60) return `il y a ${elapsedMinutes} min`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `il y a ${elapsedHours} h`

  const elapsedDays = Math.floor(elapsedHours / 24)
  return elapsedDays === 1 ? 'hier' : `il y a ${elapsedDays} jours`
}

function formatFCFA(montant) {
  return `${montant.toLocaleString('fr-FR')} F CFA`
}

function KpiCard({ icon, accent, label, value, detail, to }) {
  return (
    <Link className={`dashboard-kpi-card is-${accent}`} to={to}>
      <span className="dashboard-kpi-icon" aria-hidden="true"><i className={`fa-solid ${icon}`} /></span>
      <span className="dashboard-kpi-body">
        <strong>{value}</strong>
        <span className="dashboard-kpi-label">{label}</span>
        {detail && <span className="dashboard-kpi-detail">{detail}</span>}
      </span>
      <span className="dashboard-kpi-arrow" aria-hidden="true">→</span>
    </Link>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-chart-tooltip">
      {payload.map((entry) => (
        <div className="dashboard-chart-tooltip-row" key={entry.name || entry.dataKey}>
          <span className="dashboard-chart-tooltip-dot" style={{ background: entry.color || entry.payload?.fill }} />
          {entry.name} : <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function GerantDashboard() {
  const { produits, categories, categorieNomParId } = useMenuData()
  const { annonces, annonceActive } = useAnnonces()

  const produitsCounts = useMemo(() => countByStatut(produits), [produits])
  const categoriesCounts = useMemo(() => countByStatut(categories), [categories])
  const annoncesCounts = useMemo(() => countByStatut(annonces), [annonces])

  const produitsActifs = useMemo(() => produits.filter((p) => p.statut === 'ACTIF'), [produits])
  const produitsRupture = useMemo(
    () => produitsActifs.filter((p) => p.disponibilite === 'RUPTURE'),
    [produitsActifs],
  )
  const valeurCatalogue = useMemo(
    () => produitsActifs.reduce((total, p) => total + p.prix, 0),
    [produitsActifs],
  )

  const statutProduitsData = useMemo(() => ([
    { key: 'ACTIF', name: 'Actifs', value: produitsCounts.ACTIF },
    { key: 'BROUILLON', name: 'Brouillons', value: produitsCounts.BROUILLON },
    { key: 'ARCHIVE', name: 'Archivés', value: produitsCounts.ARCHIVE },
  ].filter((d) => d.value > 0)), [produitsCounts])

  const disponibiliteData = useMemo(() => {
    const enStock = produitsActifs.filter((p) => p.disponibilite === 'EN_STOCK').length
    return [
      { key: 'EN_STOCK', name: 'En stock', value: enStock },
      { key: 'RUPTURE', name: 'Rupture', value: produitsRupture.length },
    ].filter((d) => d.value > 0)
  }, [produitsActifs, produitsRupture])

  const categoriesChartData = useMemo(() => (
    categories
      .filter((c) => c.statut !== 'ARCHIVE')
      .map((c) => ({
        nom: c.nom,
        produits: produits.filter((p) => p.categorieId === c.id && p.statut !== 'ARCHIVE').length,
      }))
      .sort((a, b) => b.produits - a.produits)
  ), [categories, produits])

  const annoncesChartData = useMemo(() => ([
    { key: 'ACTIF', name: 'Actives', value: annoncesCounts.ACTIF },
    { key: 'BROUILLON', name: 'Brouillons', value: annoncesCounts.BROUILLON },
    { key: 'ARCHIVE', name: 'Archivées', value: annoncesCounts.ARCHIVE },
  ].filter((d) => d.value > 0)), [annoncesCounts])

  const activiteRecente = useMemo(() => {
    const items = [
      ...produits.map((p) => ({
        key: `produit-${p.id}`,
        type: 'Produit',
        icon: 'fa-utensils',
        nom: p.nom,
        meta: categorieNomParId(p.categorieId),
        statut: p.statut,
        updatedAt: p.updatedAt,
        to: '/produits',
      })),
      ...categories.map((c) => ({
        key: `categorie-${c.id}`, type: 'Catégorie', icon: 'fa-tags', nom: c.nom, statut: c.statut, updatedAt: c.updatedAt, to: '/categories',
      })),
      ...annonces.map((a) => ({
        key: `annonce-${a.id}`, type: 'Annonce', icon: 'fa-bullhorn', nom: a.titre, statut: a.statut, updatedAt: a.updatedAt, to: '/annonces',
      })),
    ]
    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produits, categories, annonces])

  return (
    <>
      <section className="dashboard-kpi-grid" aria-label="Indicateurs clés du menu">
        <KpiCard
          icon="fa-circle-check" accent="green" label="Produits actifs"
          value={produitsCounts.ACTIF} detail={`${produits.length} au total`} to="/produits"
        />
        <KpiCard
          icon="fa-ban" accent="red" label="Produits en rupture"
          value={produitsRupture.length} detail="parmi les actifs" to="/produits"
        />
        <KpiCard
          icon="fa-pen-to-square" accent="amber" label="Brouillons produits"
          value={produitsCounts.BROUILLON} detail="à publier" to="/produits"
        />
        <KpiCard
          icon="fa-tags" accent="green" label="Catégories actives"
          value={categoriesCounts.ACTIF} detail={`${categories.length} au total`} to="/categories"
        />
        <KpiCard
          icon="fa-bullhorn" accent="brand" label="Annonce active"
          value={annonceActive ? '1' : '0'}
          detail={annonceActive ? annonceActive.titre : 'Aucune pour le moment'}
          to="/annonces"
        />
        <KpiCard
          icon="fa-sack-dollar" accent="gray" label="Valeur du catalogue"
          value={formatFCFA(valeurCatalogue)} detail="produits actifs" to="/produits"
        />
      </section>

      <section className="dashboard-charts-grid" aria-label="Analytiques du menu">
        <div className="dashboard-panel dashboard-chart-panel dashboard-chart-panel-wide">
          <div className="dashboard-panel-heading">
            <div>
              <p className="manager-eyebrow">Catégories</p>
              <h2>Produits par catégorie</h2>
            </div>
          </div>
          {categoriesChartData.length === 0 ? (
            <p className="dashboard-chart-empty">Aucune catégorie pour le moment.</p>
          ) : (
            <ResponsiveContainer width="100%" height={248}>
              <BarChart data={categoriesChartData} margin={{ top: 4, right: 8, bottom: 4, left: -24 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="nom" interval={0} angle={-35} textAnchor="end" height={80} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={{ stroke: 'var(--chart-grid)' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--chart-cursor)' }} />
                <Bar dataKey="produits" name="Produits" fill="var(--chart-brand)" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="manager-eyebrow">Produits</p>
              <h2>Statuts des produits</h2>
            </div>
          </div>
          {statutProduitsData.length === 0 ? (
            <p className="dashboard-chart-empty">Aucun produit pour le moment.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statutProduitsData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {statutProduitsData.map((entry) => (
                    <Cell key={entry.key} fill={STATUT_CHART_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="bottom" height={32} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="manager-eyebrow">Disponibilité</p>
              <h2>Produits actifs en stock</h2>
            </div>
          </div>
          {disponibiliteData.length === 0 ? (
            <p className="dashboard-chart-empty">Aucun produit actif pour le moment.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={disponibiliteData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {disponibiliteData.map((entry) => (
                    <Cell key={entry.key} fill={entry.key === 'RUPTURE' ? 'var(--chart-red)' : 'var(--chart-green)'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="bottom" height={32} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </section>

      <section className="dashboard-panel dashboard-activity-panel" aria-label="Activité récente du menu">
        <div className="dashboard-panel-heading">
          <div>
            <p className="manager-eyebrow">Monitoring</p>
            <h2>Activité récente</h2>
          </div>
        </div>

        {activiteRecente.length === 0 ? (
          <p className="dashboard-chart-empty">Aucune activité pour le moment.</p>
        ) : (
          <ul className="dashboard-activity-list">
            {activiteRecente.map((item) => (
              <li key={item.key}>
                <Link className="dashboard-activity-row" to={item.to}>
                  <span className="dashboard-activity-icon" aria-hidden="true"><i className={`fa-solid ${item.icon}`} /></span>
                  <span className="dashboard-activity-text">
                    <strong>{item.nom}</strong>
                    <span>{item.type}{item.meta ? ` · ${item.meta}` : ''} · {STATUT_LABELS[item.statut]}</span>
                  </span>
                  <span className="dashboard-activity-time">{formatRelativeTime(item.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
