import { useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Toast from '../../components/Toast.jsx'
import ConfirmModal from '../../components/crud/ConfirmModal.jsx'
import CarteSenegal from './CarteSenegal.jsx'
import { ARRONDISSEMENTS_PAR_REGION, regionLabel } from './senegalZones.js'
import { activerRegion, definirPrix, desactiverRegion, regionsActives, zonesLivraison } from './zonesLivraisonData.js'

// Page "Zones de livraison" (Gerant, 24/10/2026) - carte des 14 regions,
// activables une a la fois (plusieurs regions actives en parallele sont
// possibles, voir cadrage), puis prix de livraison par arrondissement une
// fois une region "cadree". Entierement mockee (voir zonesLivraisonData.js) -
// voir brainstorming-chez-ketchup.md pour le cadrage complet.
function formatPrix(prix) {
  return `${Number(prix).toLocaleString('fr-FR')} F CFA`
}

export default function ZonesLivraison() {
  const [actives, setActives] = useState(() => regionsActives())
  const [regionOuverte, setRegionOuverte] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [toast, setToast] = useState(null)
  const [version, setVersion] = useState(0)

  function notify(type, message) {
    setToast({ id: Date.now(), type, message })
  }

  function selectionnerRegion(code) {
    if (actives.includes(code)) {
      setRegionOuverte(code)
      return
    }
    setConfirmation({ kind: 'activer', code })
  }

  function confirmerActivation() {
    const code = confirmation.code
    activerRegion(code)
    setActives(regionsActives())
    setRegionOuverte(code)
    setConfirmation(null)
    notify('success', `Zone de livraison activée pour la région de ${regionLabel(code)}.`)
  }

  function demanderDesactivation(code) {
    setConfirmation({ kind: 'desactiver', code })
  }

  function confirmerDesactivation() {
    const code = confirmation.code
    desactiverRegion(code)
    setActives(regionsActives())
    setRegionOuverte((current) => (current === code ? null : current))
    setConfirmation(null)
    notify('success', `Zone de livraison désactivée pour la région de ${regionLabel(code)}.`)
  }

  function changerPrix(code, nomArrondissement, valeur) {
    const prix = Math.max(0, Math.round(Number(valeur) || 0))
    definirPrix(code, nomArrondissement, prix)
    setVersion((v) => v + 1)
  }

  const regionDetail = regionOuverte ? ARRONDISSEMENTS_PAR_REGION[regionOuverte] : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prixRegion = useMemo(() => (regionOuverte ? zonesLivraison[regionOuverte] || {} : {}), [regionOuverte, version])

  const departementsRegroupes = useMemo(() => {
    if (!regionDetail) return []
    const groupes = new Map()
    for (const arrondissement of regionDetail) {
      if (!groupes.has(arrondissement.departement)) groupes.set(arrondissement.departement, [])
      groupes.get(arrondissement.departement).push(arrondissement)
    }
    return [...groupes.entries()]
  }, [regionDetail])

  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Zones de livraison</h1>
          <p>Choisissez une région sur la carte pour activer ou ajuster ses prix de livraison par arrondissement.</p>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="zones-carte-titre">
        <div className="dashboard-section-heading">
          <h2 id="zones-carte-titre">Régions</h2>
        </div>
        <CarteSenegal actives={actives} selected={regionOuverte} onSelect={selectionnerRegion} />
      </section>

      {actives.length === 0 && (
        <p className="crud-empty">Aucune zone de livraison active. Cliquez une région sur la carte pour commencer.</p>
      )}

      {actives.length > 0 && !regionOuverte && (
        <section className="dashboard-section" aria-labelledby="zones-actives-titre">
          <div className="dashboard-section-heading">
            <h2 id="zones-actives-titre">Zones actives</h2>
          </div>
          <ul className="zones-actives-liste">
            {actives.map((code) => {
              const valeurs = Object.values(zonesLivraison[code] || {})
              const min = valeurs.length ? Math.min(...valeurs) : 0
              const max = valeurs.length ? Math.max(...valeurs) : 0
              return (
                <li key={code} className="zones-actives-item">
                  <div>
                    <strong>{regionLabel(code)}</strong>
                    <span>{(ARRONDISSEMENTS_PAR_REGION[code] || []).length} arrondissements · {formatPrix(min)}{min !== max ? ` – ${formatPrix(max)}` : ''}</span>
                  </div>
                  <div className="zones-actives-actions">
                    <button className="crud-action" type="button" onClick={() => setRegionOuverte(code)}>
                      <i className="fa-solid fa-pen" aria-hidden="true" /> Gérer les prix
                    </button>
                    <button className="crud-action is-danger" type="button" onClick={() => demanderDesactivation(code)}>
                      <i className="fa-solid fa-xmark" aria-hidden="true" /> Désactiver
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {regionOuverte && (
        <section className="dashboard-section" aria-labelledby="zones-detail-titre">
          <div className="dashboard-section-heading">
            <p className="manager-eyebrow">Région</p>
            <h2 id="zones-detail-titre">{regionLabel(regionOuverte)} — prix par arrondissement</h2>
          </div>

          {departementsRegroupes.map(([departement, arrondissements]) => (
            <div key={departement} className="zones-departement-groupe">
              <h3 className="zones-departement-titre">{departement}</h3>
              <div className="zones-arrondissements-grille">
                {arrondissements.map((arrondissement) => (
                  <label key={arrondissement.nom} className="zones-arrondissement-ligne">
                    <span>{arrondissement.nom}</span>
                    <span className="zones-prix-champ">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        inputMode="numeric"
                        value={prixRegion[arrondissement.nom] ?? 0}
                        onChange={(event) => changerPrix(regionOuverte, arrondissement.nom, event.target.value)}
                        aria-label={`Prix de livraison pour ${arrondissement.nom}`}
                      />
                      <span className="zones-prix-unite">F CFA</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="manager-modal-actions zones-detail-actions">
            <button className="manager-button manager-button-quiet" type="button" onClick={() => setRegionOuverte(null)}>
              <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Retour à la carte
            </button>
            <button className="manager-button manager-button-danger" type="button" onClick={() => demanderDesactivation(regionOuverte)}>
              <i className="fa-solid fa-xmark" aria-hidden="true" /> Désactiver cette région
            </button>
          </div>
        </section>
      )}

      {confirmation?.kind === 'activer' && (
        <ConfirmModal
          title="Activer cette zone de livraison ?"
          message={`Les ${(ARRONDISSEMENTS_PAR_REGION[confirmation.code] || []).length} arrondissements de la région de ${regionLabel(confirmation.code)} seront ajoutés avec un prix par défaut de ${formatPrix(1000)}, modifiable ensuite arrondissement par arrondissement.`}
          confirmLabel="Activer"
          tone="info"
          icon="fa-map-location-dot"
          onConfirm={confirmerActivation}
          onCancel={() => setConfirmation(null)}
        />
      )}
      {confirmation?.kind === 'desactiver' && (
        <ConfirmModal
          title="Désactiver cette zone de livraison ?"
          message={`La région de ${regionLabel(confirmation.code)} et ses prix par arrondissement seront retirés des zones de livraison.`}
          confirmLabel="Désactiver"
          tone="danger"
          icon="fa-xmark"
          onConfirm={confirmerDesactivation}
          onCancel={() => setConfirmation(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  )
}
