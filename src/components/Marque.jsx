import { marque, nomEnDeuxTons } from '../config/marque'

// Identite visuelle du restaurant (voir src/config/marque.js) : jamais de nom
// ni de couleur ecrits en dur dans les ecrans.

/** Nom en majuscules, la fin du nom dans la couleur de marque (SEN + YUMMIES). */
export function NomMarque({ className = '', accentClassName }) {
  const { debut, accent } = nomEnDeuxTons()
  return (
    <span className={className} style={{ textTransform: 'uppercase' }}>
      {debut}
      {accent && <span className={accentClassName}>{accent}</span>}
    </span>
  )
}

/** Initiales du monogramme, ou logo s'il est configure. */
export function Initiales({ className = '' }) {
  if (marque.logo) {
    return (
      <span className={className}>
        <img src={marque.logo} alt="" style={{ width: '1.6em', height: '1.6em', objectFit: 'contain', verticalAlign: 'middle' }} />
      </span>
    )
  }
  return <span className={className}>{marque.initiales}</span>
}
