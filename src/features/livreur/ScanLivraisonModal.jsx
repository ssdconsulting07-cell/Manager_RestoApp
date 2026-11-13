import { useEffect, useRef, useState } from 'react'
import { ticketId } from '../cuisine/cuisineUtils.js'

// Modale de confirmation de livraison par scan QR : preuve de remise. Le
// client presente le QR code de son ecran de suivi (App Client, contenu
// "SENYUMMIES-<ticket>", ou le numero seul), le livreur le scanne.
//
// Secours de saisie manuelle du numero : propose (lien discret) des que la
// camera est indisponible, apres un premier QR qui ne correspond pas, ou
// apres SECOURS_APRES_MS sans lecture reussie (mauvaise lumiere, ecran du
// client illisible...). On pousse d'abord a scanner, sans jamais laisser le
// livreur bloque.
//
// Etats visibles : demarrage de la camera, scan en cours, validation de la
// livraison (la modale reste ouverte jusqu'a la reponse du serveur).
const PREFIXE = 'SENYUMMIES-'
const ZONE_CAMERA_ID = 'scan-livraison-camera'
const SECOURS_APRES_MS = 8000

function correspond(valeurScannee, commande) {
  const texte = valeurScannee.trim().toUpperCase()
  if (!texte) return false
  const sansPrefixe = texte.startsWith(PREFIXE) ? texte.slice(PREFIXE.length) : texte
  return sansPrefixe === ticketId(commande).toUpperCase()
}

// Arret de la camera SANS jamais lever d'erreur : html5-qrcode leve une
// exception synchrone si on l'arrete alors qu'il ne tourne plus (cas d'un
// scan reussi puis fermeture de la modale), ce qui faisait planter tout
// l'ecran (page blanche).
function arreterCamera(instance) {
  if (!instance) return Promise.resolve()
  try {
    const enCours = typeof instance.isScanning === 'boolean' ? instance.isScanning : true
    const arret = enCours ? instance.stop() : null
    return Promise.resolve(arret).catch(() => {}).then(() => {
      try { instance.clear?.() } catch { /* deja nettoye */ }
    })
  } catch {
    return Promise.resolve()
  }
}

export default function ScanLivraisonModal({ commande, onConfirm, onCancel }) {
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState(null)
  const [camera, setCamera] = useState('demarrage') // demarrage | active | indisponible
  const [secoursPropose, setSecoursPropose] = useState(false)
  const [secoursOuvert, setSecoursOuvert] = useState(false)
  const [validation, setValidation] = useState(false)
  const instanceRef = useRef(null)
  const validationRef = useRef(false)
  // Derniere version des rappels : la camera ne redemarre pas a chaque
  // rafraichissement de la liste (avant : nouvelle fonction a chaque rendu =
  // camera arretee puis relancee toutes les quelques secondes).
  const confirmerRef = useRef(onConfirm)
  confirmerRef.current = onConfirm
  const commandeRef = useRef(commande)
  commandeRef.current = commande
  const idTicket = ticketId(commande)

  async function confirmer() {
    if (validationRef.current) return
    validationRef.current = true
    setValidation(true)
    setErreur(null)
    await arreterCamera(instanceRef.current)
    instanceRef.current = null
    try {
      await confirmerRef.current?.()
    } catch {
      validationRef.current = false
      setValidation(false)
      setErreur('La livraison n’a pas pu être enregistrée. Réessayez.')
    }
  }
  const confirmerAppel = useRef(confirmer)
  confirmerAppel.current = confirmer

  useEffect(() => {
    let annule = false
    const minuterie = setTimeout(() => setSecoursPropose(true), SECOURS_APRES_MS)

    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        if (annule) return
        const instance = new Html5Qrcode(ZONE_CAMERA_ID)
        instanceRef.current = instance
        return instance
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (valeurScannee) => {
              if (validationRef.current) return
              if (correspond(valeurScannee, commandeRef.current)) {
                confirmerAppel.current()
              } else {
                setErreur('Ce QR code ne correspond pas à cette commande.')
                setSecoursPropose(true)
              }
            },
            () => {
              // Appele en continu tant qu'aucun QR n'est detecte : rien a faire.
            },
          )
          .then(() => {
            if (annule) arreterCamera(instance)
            else setCamera('active')
          })
      })
      .catch(() => {
        if (annule) return
        setCamera('indisponible')
        setSecoursPropose(true)
        setSecoursOuvert(true)
      })

    return () => {
      annule = true
      clearTimeout(minuterie)
      arreterCamera(instanceRef.current)
      instanceRef.current = null
    }
  }, [])

  function validerSaisie(event) {
    event.preventDefault()
    if (correspond(saisie, commande)) {
      confirmer()
    } else {
      setErreur(`Numéro incorrect : ce n’est pas la commande #${idTicket}.`)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !validation && onCancel()}>
      <section className="manager-modal scan-livraison-modal" role="dialog" aria-modal="true" aria-labelledby="scan-livraison-title" aria-busy={validation}>
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Livraison #{idTicket}</p>
            <h2 id="scan-livraison-title">Scanner le QR code du client</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onCancel} disabled={validation}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {camera !== 'indisponible' ? (
          <div className="scan-livraison-zone">
            <div id={ZONE_CAMERA_ID} className="scan-livraison-camera" />
            {(camera === 'demarrage' || validation) && (
              <div className="scan-livraison-attente" role="status">
                <span className="scan-livraison-spinner" aria-hidden="true" />
                {validation ? 'Validation de la livraison…' : 'Démarrage de la caméra…'}
              </div>
            )}
          </div>
        ) : (
          <p className="scan-livraison-camera-indispo">
            <i className="fa-solid fa-camera-slash" aria-hidden="true" />
            Caméra indisponible : saisissez le numéro du ticket ci-dessous.
          </p>
        )}

        {erreur && <p role="alert" className="staff-users-error scan-livraison-error">{erreur}</p>}

        {validation && camera === 'indisponible' && (
          <p className="scan-livraison-attente-texte" role="status">
            <span className="scan-livraison-spinner" aria-hidden="true" /> Validation de la livraison…
          </p>
        )}

        {secoursPropose && !secoursOuvert && !validation && (
          <button type="button" className="scan-livraison-lien-secours" onClick={() => setSecoursOuvert(true)}>
            <i className="fa-solid fa-keyboard" aria-hidden="true" /> Le scan ne marche pas ? Saisir le numéro du ticket
          </button>
        )}

        {secoursOuvert && (
          <form className="scan-livraison-fallback" onSubmit={validerSaisie}>
            <label htmlFor="scan-livraison-manuel">Numéro du ticket (affiché sur l’écran du client)</label>
            <div className="scan-livraison-fallback-row">
              <input
                id="scan-livraison-manuel"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={`Ex. ${idTicket}`}
                value={saisie}
                disabled={validation}
                onChange={(event) => { setSaisie(event.target.value); setErreur(null) }}
              />
              <button className="manager-button manager-button-primary" type="submit" disabled={!saisie.trim() || validation}>
                {validation ? 'Validation…' : 'Valider'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
