// Erreurs d'enregistrement remontees par les donnees partagees (menu,
// accompagnements, annonces, zones...). Les ecrans affichent leur message
// de succes tout de suite (mise a jour immediate) ; si le serveur refuse
// ensuite, ce canal affiche l'erreur dans une alerte globale (AlertesApi)
// et les donnees sont rechargees depuis le serveur.
const EVENEMENT = 'senyummies:erreur-api'

// Message lisible pour le Gerant selon la reponse du serveur.
export function messageErreur(err, action = 'L’enregistrement') {
  if (!err) return `${action} a échoué.`
  if (err.status === 409 && err.code === 'VERSION_CONFLICT') {
    return 'Cette fiche a été modifiée entre-temps par quelqu’un d’autre : la liste a été rechargée, refaites votre modification.'
  }
  if (err.status === 403) return 'Action non autorisée pour votre rôle.'
  if (err.status === 413) return 'Photo trop lourde (2 Mo maximum).'
  if (err.code === 'RESEAU') return err.message
  return err.message ? `${action} a échoué : ${err.message}` : `${action} a échoué.`
}

export function signalerErreurApi(err, action) {
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: messageErreur(err, action) }))
}

export function ecouterErreursApi(rappel) {
  const gestionnaire = (e) => rappel(e.detail)
  window.addEventListener(EVENEMENT, gestionnaire)
  return () => window.removeEventListener(EVENEMENT, gestionnaire)
}
