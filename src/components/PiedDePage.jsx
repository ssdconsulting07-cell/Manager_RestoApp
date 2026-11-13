import { useEffect, useState } from 'react'
import { SUPPORT_EMAIL, SUPPORT_TELEPHONE, telephoneLisible } from '../config/support.js'
import './pied-de-page.css'

// Pied de page discret : version a gauche, lien "Besoin d'aide ?" a droite
// (meme couleur). Le lien ouvre une feuille du bas sur smartphone, une
// fenetre centree ailleurs, avec deux lignes cliquables : appeler (tel:) et
// ecrire (mailto:). Meme fonctionnement que l'app Client (AideSheet.jsx).
export default function PiedDePage({ className = '' }) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      <footer className={`pied-de-page ${className}`}>
        <span>v{__APP_VERSION__}</span>
        <button type="button" className="pied-de-page-aide" aria-haspopup="dialog" onClick={() => setOuvert(true)}>
          Besoin d’aide ?
        </button>
      </footer>
      {ouvert && <FeuilleAide onFermer={() => setOuvert(false)} />}
    </>
  )
}

function FeuilleAide({ onFermer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', onKey)
    const debordement = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = debordement
    }
  }, [onFermer])

  const sujet = encodeURIComponent(`Besoin d'aide - SenYummies Manager v${__APP_VERSION__}`)
  const lignes = [
    { href: `tel:${SUPPORT_TELEPHONE.replace(/\s/g, '')}`, icone: 'fa-phone', titre: 'Appeler le support', detail: telephoneLisible(SUPPORT_TELEPHONE) },
    { href: `mailto:${SUPPORT_EMAIL}?subject=${sujet}`, icone: 'fa-envelope', titre: 'Écrire au support', detail: SUPPORT_EMAIL },
  ]

  return (
    <div className="aide-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onFermer()}>
      <section className="aide-feuille" role="dialog" aria-modal="true" aria-labelledby="aide-titre">
        <span className="aide-poignee" aria-hidden="true" />
        <div className="aide-entete">
          <div>
            <h2 id="aide-titre">Besoin d’aide ?</h2>
            <p>Un souci avec l’application ? Contactez le support.</p>
          </div>
          <button type="button" className="aide-fermer" aria-label="Fermer" onClick={onFermer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <ul className="aide-lignes">
          {lignes.map((l) => (
            <li key={l.href}>
              <a href={l.href}>
                <span className="aide-icone" aria-hidden="true"><i className={`fa-solid ${l.icone}`} /></span>
                <span className="aide-texte">
                  <strong>{l.titre}</strong>
                  <span>{l.detail}</span>
                </span>
                <i className="fa-solid fa-chevron-right aide-chevron" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
