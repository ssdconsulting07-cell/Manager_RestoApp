import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet } from '../../api/client.js'

// Ventes comptoir du vendeur connecte, depuis le serveur : GET /commandes
// (file du Vendeur = commandes a emporter), filtrees sur le canal COMPTOIR et
// sur l'auteur de la creation (historique). Format des tickets de caisse
// (Recu.jsx, HistoriqueVentes.jsx, exportVentes.js).

function estAujourdhui(iso) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

export function versVente(commande) {
  const creation = (commande.historique || []).find((h) => h.statut === 'CREEE') || commande.historique?.[0]
  return {
    id: `vente-${commande.id}`,
    numero: commande.id,
    vendeur: creation?.par || null,
    lignes: (commande.lignes || []).map((l, index) => ({
      ligneId: `${commande.id}-${index}`,
      produitId: l.produitId,
      nom: l.nom,
      prix: l.prixUnitaire,
      quantite: l.quantite,
      accompagnementNom: l.accompagnementNom || null,
    })),
    total: commande.total,
    modePaiement: commande.moyenPaiement,
    montantRecu: commande.montantRecu ?? commande.total,
    monnaieRendue: commande.monnaieRendue ?? 0,
    createdAt: commande.creeLe,
  }
}

export default function useVentesVendeur(username) {
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const charger = useCallback(async () => {
    try {
      const liste = await apiGet('/commandes')
      setCommandes(Array.isArray(liste) ? liste : [])
      setErreur(null)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  return useMemo(() => {
    const ventes = commandes
      .filter((c) => c.canal === 'COMPTOIR' && c.statut !== 'ANNULEE')
      .map(versVente)
      .filter((v) => v.vendeur === username)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const ventesDuJour = ventes.filter((v) => estAujourdhui(v.createdAt))
    return {
      ventes,
      ventesDuJour,
      totalDuJour: ventesDuJour.reduce((somme, v) => somme + v.total, 0),
      chargement,
      erreur,
      recharger: charger,
    }
  }, [commandes, username, chargement, erreur, charger])
}
