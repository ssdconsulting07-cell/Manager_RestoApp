import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL, getAuthToken } from '../api/client.js'

// Flux temps reel des commandes (GET /temps-reel/commandes, Server-Sent
// Events, staff authentifie, filtre par role cote serveur).
//
// EventSource ne sait pas envoyer l'en-tete Authorization : le flux est lu
// avec fetch en continu. Reconnexion automatique (delai annonce par le
// serveur, 5 s par defaut) avec Last-Event-ID pour rattraper les evenements
// manques pendant la coupure.
//
// surEvenement({ type, commande }) est appele a chaque evenement "commande"
// (COMMANDE_PAYEE, STATUT_CHANGE). Renvoie true tant que le flux est ouvert :
// les ecrans espacent alors leur rafraichissement de secours.
export default function useFluxCommandes(surEvenement, { actif = true } = {}) {
  const [connecte, setConnecte] = useState(false)
  const rappel = useRef(surEvenement)
  rappel.current = surEvenement

  useEffect(() => {
    if (!actif || typeof fetch !== 'function' || typeof TextDecoder === 'undefined') return undefined
    let arrete = false
    let controleur = null
    let minuterie = null
    let dernierId = null
    let delai = 5000

    const traiterBloc = (bloc) => {
      let evenement = 'message'
      const donnees = []
      for (const ligne of bloc.split('\n')) {
        if (!ligne || ligne.startsWith(':')) continue
        const deuxPoints = ligne.indexOf(':')
        const champ = deuxPoints < 0 ? ligne : ligne.slice(0, deuxPoints)
        const valeur = deuxPoints < 0 ? '' : ligne.slice(deuxPoints + 1).replace(/^ /, '')
        if (champ === 'id') dernierId = valeur
        else if (champ === 'event') evenement = valeur
        else if (champ === 'data') donnees.push(valeur)
        else if (champ === 'retry' && Number(valeur) > 0) delai = Number(valeur)
      }
      if (evenement !== 'commande' || !donnees.length) return
      try {
        rappel.current?.(JSON.parse(donnees.join('\n')))
      } catch {
        // evenement illisible : ignore (le rafraichissement de secours rattrape)
      }
    }

    const ouvrir = async () => {
      const jeton = getAuthToken()
      if (arrete || !jeton) return
      controleur = new AbortController()
      try {
        const reponse = await fetch(`${API_BASE_URL}/temps-reel/commandes`, {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${jeton}`,
            ...(dernierId ? { 'Last-Event-ID': dernierId } : {}),
          },
          signal: controleur.signal,
        })
        if (!reponse.ok || !reponse.body) throw new Error(`flux ${reponse.status}`)
        setConnecte(true)
        const lecteur = reponse.body.getReader()
        const decodeur = new TextDecoder()
        let tampon = ''
        for (;;) {
          const { value, done } = await lecteur.read()
          if (done) break
          tampon += decodeur.decode(value, { stream: true }).replace(/\r\n?/g, '\n')
          let fin = tampon.indexOf('\n\n')
          while (fin >= 0) {
            traiterBloc(tampon.slice(0, fin))
            tampon = tampon.slice(fin + 2)
            fin = tampon.indexOf('\n\n')
          }
        }
      } catch {
        // coupure reseau, serveur redemarre, session expiree : on reessaie
      }
      setConnecte(false)
      if (!arrete) minuterie = setTimeout(ouvrir, delai)
    }

    ouvrir()
    return () => {
      arrete = true
      clearTimeout(minuterie)
      controleur?.abort()
    }
  }, [actif])

  return connecte
}
