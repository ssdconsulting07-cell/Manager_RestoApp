import { Component } from 'react'

// Filet de securite : une erreur d'affichage ne laisse plus une page
// blanche sans issue. Message clair, retour au tableau de bord ou
// rechargement ; l'erreur reste visible dans la console pour le support.
export default class FiletErreur extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  componentDidCatch(erreur, info) {
    console.error('Erreur d’affichage interceptée', erreur, info?.componentStack)
  }

  render() {
    if (!this.state.erreur) return this.props.children
    return (
      <main className="filet-erreur" role="alert">
        <div className="filet-erreur-carte">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          <h1>Un problème est survenu</h1>
          <p>L’écran n’a pas pu s’afficher. Vos données ne sont pas perdues.</p>
          <div className="filet-erreur-actions">
            <button type="button" className="manager-button manager-button-primary" onClick={() => window.location.assign('/dashboard')}>
              Retour au tableau de bord
            </button>
            <button type="button" className="manager-button manager-button-quiet" onClick={() => window.location.reload()}>
              Recharger la page
            </button>
          </div>
        </div>
      </main>
    )
  }
}
