// Impression d'un ticket 80 mm — commun au recu de vente (Vendeur) et au bon
// de livraison (Cuisine / Livreur), pour un seul modele visuel a maintenir.
// Le ticket est ecrit dans un onglet dedie (HTML autonome, CSS en ligne) :
// la regle @page 80 mm reste isolee de l'onglet principal.

export function echapperHtml(texte) {
  return String(texte ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatDateTicket(iso) {
  const date = iso ? new Date(iso) : new Date()
  const jour = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
  return `${jour} à ${heure}`
}

// Memes regles que src/components/ticket/ticket.css (rendu ecran).
const CSS_TICKET = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; width: 80mm; padding: 4mm 3mm; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #141414; }
  .eyebrow { margin: 0; color: #a6192e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; text-align: center; }
  h2 { margin: 4px 0; font-size: 18px; text-align: center; }
  .meta { margin: 0 0 14px; color: #6b6b6b; font-size: 12px; text-align: center; }
  .bloc { display: flex; flex-direction: column; gap: 4px; margin: 0 0 12px; padding: 10px 0 0; border-top: 1px dashed #bbb; }
  .bloc-titre { margin: 0 0 2px; color: #a6192e; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
  .info { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; }
  .info span:first-child { color: #6b6b6b; }
  .info span:last-child { text-align: right; font-weight: 600; }
  .note { margin: 4px 0 0; padding: 6px 8px; border: 1px solid #e3c98f; border-radius: 6px; font-size: 11.5px; }
  ul { list-style: none; margin: 0 0 14px; padding: 12px 0; border-top: 1px dashed #bbb; border-bottom: 1px dashed #bbb; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
  .detail { display: block; color: #6b6b6b; font-size: 11px; }
  .totaux { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; color: #6b6b6b; }
  .row.total { color: #141414; font-size: 16px; font-weight: 700; }
  .paye { color: #1f6f57; font-weight: 700; }
  .qr { display: flex; flex-direction: column; align-items: center; gap: 2px; margin: 4px 0 10px; }
  .qr svg { width: 34mm; height: 34mm; }
  .qr p { margin: 0; color: #6b6b6b; font-size: 10.5px; text-align: center; }
  .merci { margin: 0; color: #6b6b6b; font-size: 11px; font-style: italic; text-align: center; }
`

export function documentTicket(titre, corpsHtml) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${echapperHtml(titre)}</title>
<style>${CSS_TICKET}</style>
</head>
<body>
${corpsHtml}
</body>
</html>`
}

// Ouvre l'onglet tout de suite (dans le geste de l'utilisateur, sinon le
// navigateur bloque la fenetre), puis y ecrit le ticket une fois pret.
// Corps deja pret (texte) : ecrit et imprime immediatement ; corps en cours
// de preparation (promesse, ex. QR code) : ecrit des qu'il est pret.
export function imprimerTicket(titre, corpsHtmlOuPromesse) {
  const fenetre = window.open('', '_blank', 'width=420,height=680')
  if (!fenetre) return
  const ecrire = (corps) => {
    fenetre.document.write(documentTicket(titre, corps))
    fenetre.document.close()
    fenetre.focus()
    fenetre.print()
    fenetre.onafterprint = () => fenetre.close()
  }
  if (typeof corpsHtmlOuPromesse === 'string') ecrire(corpsHtmlOuPromesse)
  else Promise.resolve(corpsHtmlOuPromesse).then(ecrire)
}
