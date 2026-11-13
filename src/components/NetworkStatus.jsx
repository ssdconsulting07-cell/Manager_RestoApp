import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../api/client.js'
import { ETATS, demarrerSurveillanceReseau, messageTransition } from '../utils/reseau.js'
import Toast from './Toast.jsx'

// Etat de la connexion, meme logique que l'app Client (utils/reseau.js) :
// - toast a chaque changement : hors ligne, instable, retablie ;
// - bandeau permanent tant que le poste est hors ligne (un toast disparait,
//   l'information reste vraie tant que le reseau n'est pas revenu).
// La sonde vise GET /health (sans acces base de donnees cote backend) ; les
// vrais appels API (api/client.js) alimentent aussi la detection.
const TYPE_TOAST = { succes: 'success', alerte: 'warning', erreur: 'error' }

export default function NetworkStatus() {
  const [toast, setToast] = useState(null)
  const [etat, setEtat] = useState(ETATS.EN_LIGNE)

  useEffect(
    () =>
      demarrerSurveillanceReseau({
        urlSonde: `${API_BASE_URL}/health`,
        onChange: (apres, avant) => {
          setEtat(apres)
          const message = messageTransition(avant, apres)
          if (message) setToast({ id: Date.now(), type: TYPE_TOAST[message.type], message: message.texte })
        },
      }),
    [],
  )

  return (
    <>
      {etat === ETATS.HORS_LIGNE && (
        <p className="network-banner" role="status">
          <i className="fa-solid fa-wifi" aria-hidden="true" />
          Hors ligne · les données affichées peuvent ne pas être à jour
        </p>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
