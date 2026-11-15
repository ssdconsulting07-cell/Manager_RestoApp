import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../api/client.js'

// Horaires des services (Gerant) : decident quand les plats du jour sont
// commandables dans l'App Client. Le diner peut finir apres minuit (ex.
// 18:00 - 01:00) : il compte alors pour le jour ou il a commence. Hors
// service, les plats restent visibles en lecture seule cote client.
const DEFAUT = [
  { service: 'DEJEUNER', debut: '11:00', fin: '15:00' },
  { service: 'DINER', debut: '18:00', fin: '01:00' },
]
const LIBELLES = { DEJEUNER: 'Déjeuner', DINER: 'Dîner' }

export default function HorairesServices({ source = 'api', notify }) {
  const [horaires, setHoraires] = useState(DEFAUT)
  const [initial, setInitial] = useState(DEFAUT)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (source !== 'api') return
    apiGet('/horaires-services')
      .then((liste) => {
        if (Array.isArray(liste) && liste.length) {
          const tries = DEFAUT.map((d) => liste.find((h) => h.service === d.service) || d)
          setHoraires(tries)
          setInitial(tries)
        }
      })
      .catch(() => {})
  }, [source])

  const modifie = JSON.stringify(horaires) !== JSON.stringify(initial)
  const changer = (service, champ, valeur) =>
    setHoraires((liste) => liste.map((h) => (h.service === service ? { ...h, [champ]: valeur } : h)))
  const invalide = horaires.some((h) => !h.debut || !h.fin || h.debut === h.fin)

  async function enregistrer(e) {
    e.preventDefault()
    if (source !== 'api') {
      setInitial(horaires)
      notify?.('success', 'Horaires enregistrés.')
      return
    }
    setEnvoi(true)
    try {
      const maj = await apiPut('/horaires-services', horaires.map(({ service, debut, fin, version }) => ({ service, debut, fin, version })))
      const tries = DEFAUT.map((d) => maj.find((h) => h.service === d.service) || d)
      setHoraires(tries)
      setInitial(tries)
      notify?.('success', 'Horaires enregistrés : l’app client est à jour.')
    } catch (err) {
      notify?.('error', err.message || 'Enregistrement impossible.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="horaires-services" onSubmit={enregistrer} aria-labelledby="horaires-titre">
      <div className="horaires-services-texte">
        <h2 id="horaires-titre"><i className="fa-solid fa-clock" aria-hidden="true" /> Horaires des services</h2>
        <p>Les plats du jour ne se commandent que pendant leur service. En dehors, les clients les voient en lecture seule.</p>
      </div>
      <div className="horaires-services-champs">
        {horaires.map((h) => (
          <fieldset key={h.service}>
            <legend>
              <i className={`fa-solid ${h.service === 'DEJEUNER' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" /> {LIBELLES[h.service]}
            </legend>
            <label>
              De
              <input type="time" value={h.debut} onChange={(e) => changer(h.service, 'debut', e.target.value)} required />
            </label>
            <label>
              à
              <input type="time" value={h.fin} onChange={(e) => changer(h.service, 'fin', e.target.value)} required />
            </label>
            {h.fin && h.debut && h.fin < h.debut && <small>Finit après minuit</small>}
          </fieldset>
        ))}
        <button className="manager-button manager-button-primary" type="submit" disabled={!modifie || invalide || envoi}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
