// Aide affichee au-dessus des boutons d'un formulaire tant que l'action
// principale est inactive : dit simplement ce qui manque (critere de
// guidage de Bastien & Scapin), au lieu d'un bouton grise sans explication.
// Meme formulation que l'app Client ("Pour continuer, indiquez ...").
export default function AideFormulaire({ manquants, action = 'enregistrer' }) {
  const liste = (manquants || []).filter(Boolean)
  if (liste.length === 0) return null
  return (
    <p className="manager-form-hint" role="status">
      <i className="fa-solid fa-circle-info" aria-hidden="true" />
      <span>
        Pour {action}, complétez : {liste.join(', ')}.
      </span>
    </p>
  )
}
