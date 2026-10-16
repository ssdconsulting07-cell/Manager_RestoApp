import { useEffect, useRef, useState } from 'react'
import { ticketId } from '../cuisine/cuisineUtils.js'

// Modale de confirmation de livraison par scan QR — retour utilisateur :
// remplace un simple bouton "Marquer livrée" par une preuve de remise.
// Le client presente un QR code sur son telephone (ecran de suivi de
// l'app Client, pas encore construit a ce jour), le livreur le scanne.
// Contenu du QR code valide avec l'utilisateur : simplement le numero de
// ticket en texte brut (ex. "1049"), avec ou sans le prefixe
// "SENYUMMIES-" — assez simple pour etre teste des aujourd'hui (n'importe
// quel generateur de QR en ligne avec ce texte suffit), et l'equipe App
// Client n'aura qu'a reprendre ce meme format quand elle construira son
// ecran. Secours de saisie manuelle si la camera ne marche pas (refusee,
// mauvaise lumiere, etc.) — meme verification des deux cotes.
//
// Secours de saisie manuelle masque par defaut (retour utilisateur,
// 16/10/2026) : n'apparait qu'apres plus de 3 echecs de scan (ou tout de
// suite si la camera est indisponible, cameraIndisponible plus bas), pour
// pousser a vraiment scanner plutot que de taper le numero d'emblee —
// compte les echecs de scan ET de saisie manuelle une fois visible, pas
// seulement les echecs de scan.
const PREFIXE = 'SENYUMMIES-'
const ZONE_CAMERA_ID = 'scan-livraison-camera'
const ERREURS_AVANT_SAISIE_MANUELLE = 3

function correspond(valeurScannee, commande) {
  const texte = valeurScannee.trim().toUpperCase()
  if (!texte) return false
  const sansPrefixe = texte.startsWith(PREFIXE) ? texte.slice(PREFIXE.length) : texte
  return sansPrefixe === ticketId(commande).toUpperCase()
}

export default function ScanLivraisonModal({ commande, onConfirm, onCancel }) {
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState(null)
  const [cameraIndisponible, setCameraIndisponible] = useState(false)
  const [erreursScan, setErreursScan] = useState(0)
  const idTicket = ticketId(commande)
  const saisieManuelleVisible = cameraIndisponible || erreursScan > ERREURS_AVANT_SAISIE_MANUELLE

  // html5-qrcode charge a la demande (comme xlsx, voir exportJournalAudit.js) :
  // pas de poids supplementaire pour les ecrans qui n'ouvrent jamais ce
  // scanner. `annule` protege contre le double-montage de React.StrictMode
  // en developpement (meme pattern que la 1ere version de l'effet de
  // transition sur Commandes.jsx, voir son historique) : si le nettoyage
  // intervient avant que l'import dynamique ne soit resolu, la camera
  // n'est jamais demarree pour cette instance jetee.
  useEffect(() => {
    let annule = false
    let instance = null

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (annule) return
      instance = new Html5Qrcode(ZONE_CAMERA_ID)
      instance
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (valeurScannee) => {
            if (correspond(valeurScannee, commande)) {
              instance.stop().catch(() => {}).finally(() => onConfirm())
            } else {
              setErreur('Ce QR code ne correspond pas à cette commande.')
              setErreursScan((n) => n + 1)
            }
          },
          () => {
            // Appele en continu tant qu'aucun QR n'est detecte dans la
            // trame courante — non critique, rien a faire.
          },
        )
        .catch(() => {
          if (!annule) setCameraIndisponible(true)
        })
    })

    return () => {
      annule = true
      if (instance) {
        instance.stop().catch(() => {}).then(() => instance.clear?.()).catch(() => {})
      }
    }
  }, [commande, onConfirm])

  function validerSaisie(event) {
    event.preventDefault()
    if (correspond(saisie, commande)) {
      onConfirm()
    } else {
      setErreur(`Numéro incorrect — ne correspond pas à la commande #${idTicket}.`)
      setErreursScan((n) => n + 1)
    }
  }

  return (
    <div className="manager-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="manager-modal scan-livraison-modal" role="dialog" aria-modal="true" aria-labelledby="scan-livraison-title">
        <div className="manager-modal-header">
          <div>
            <p className="manager-eyebrow">Livraison #{idTicket}</p>
            <h2 id="scan-livraison-title">Scanner le QR code du client</h2>
          </div>
          <button className="manager-icon-button" type="button" aria-label="Fermer" onClick={onCancel}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {!cameraIndisponible ? (
          <div id={ZONE_CAMERA_ID} className="scan-livraison-camera" />
        ) : (
          <p className="scan-livraison-camera-indispo">
            <i className="fa-solid fa-camera-slash" aria-hidden="true" />
            Caméra indisponible — utilisez la saisie manuelle ci-dessous.
          </p>
        )}

        {erreur && <p role="alert" className="staff-users-error scan-livraison-error">{erreur}</p>}

        {saisieManuelleVisible ? (
          <form className="scan-livraison-fallback" onSubmit={validerSaisie}>
            <label htmlFor="scan-livraison-manuel">Ou saisissez le numéro manuellement</label>
            <div className="scan-livraison-fallback-row">
              <input
                id="scan-livraison-manuel"
                type="text"
                inputMode="numeric"
                placeholder={`Ex. ${idTicket}`}
                value={saisie}
                onChange={(event) => { setSaisie(event.target.value); setErreur(null) }}
              />
              <button className="manager-button manager-button-primary" type="submit" disabled={!saisie.trim()}>
                Valider
              </button>
            </div>
          </form>
        ) : (
          // Encourage a continuer de scanner plutot que de reveler tout de
          // suite qu'une saisie manuelle existe (voir le commentaire en
          // tete de fichier) — ne s'affiche qu'apres un premier echec, pas
          // avant (inutile de mentionner un secours tant que rien n'a
          // encore rate).
          erreursScan > 0 && (
            <p className="scan-livraison-fallback-hint">
              La saisie manuelle du numéro sera proposée après {ERREURS_AVANT_SAISIE_MANUELLE + 1 - erreursScan} échec{ERREURS_AVANT_SAISIE_MANUELLE + 1 - erreursScan > 1 ? 's' : ''} de scan supplémentaire{ERREURS_AVANT_SAISIE_MANUELLE + 1 - erreursScan > 1 ? 's' : ''}.
            </p>
          )
        )}
      </section>
    </div>
  )
}
