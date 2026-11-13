// Ventes comptoir — MOCK en memoire en attendant le module Commandes/Paiements
// du backend (dossiers vides, voir commandesData.js). Espace vendeur/caissier
// fusionne (V2 de la feuille de route) : prise de commande au comptoir,
// encaissement especes, recu, historique propre a chaque vendeur.
//
// Chaque vente reste en memoire pour la session en cours seulement (pas de
// backend, pas de persistance au rechargement) — meme logique que les autres
// modules mock de cet espace (commandesData.js, financeData.js, auditData.js).
import { PRODUITS_INITIAUX } from '../gerant/menuData.js'

function produit(id) {
  return PRODUITS_INITIAUX.find((p) => p.id === id)
}

function ligne(produitId, quantite) {
  const p = produit(produitId)
  return { produitId, nom: p.nom, prix: p.prix, quantite }
}

function totalLignes(lignes) {
  return lignes.reduce((somme, l) => somme + l.prix * l.quantite, 0)
}

// Historique de demarrage pour le compte vendeur seede (voir StaffUserSeed
// cote Backend_RestoApp) : quelques ventes deja encaissees aujourd'hui, pour
// que l'historique et le dashboard Vendeur ne soient pas vides a la
// premiere connexion. Moyens de paiement varies (memes cles que
// modesPaiement.jsx) ; montantRecu = total hors especes.
const SEED_VENDEUR = 'vendeur'

function ilYA(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString()
}

const VENTES_INITIALES = [
  { numero: 101, lignes: [ligne('produit-1', 1), ligne('produit-3', 1), ligne('produit-4', 1)], modePaiement: 'especes', montantRecu: 6500, createdAt: ilYA(240) },
  { numero: 102, lignes: [ligne('produit-10', 2), ligne('produit-18', 2)], modePaiement: 'wave', createdAt: ilYA(205) },
  { numero: 103, lignes: [ligne('produit-7', 1), ligne('produit-14', 1), ligne('produit-20', 1)], modePaiement: 'orange-money', createdAt: ilYA(150) },
  { numero: 104, lignes: [ligne('produit-1', 2), ligne('produit-3', 1), ligne('produit-19', 2)], modePaiement: 'especes', montantRecu: 12000, createdAt: ilYA(95) },
  { numero: 105, lignes: [ligne('produit-12', 1), ligne('produit-23', 1)], modePaiement: 'carte', createdAt: ilYA(40) },
].map((v) => ({
  id: `vente-${v.numero}`,
  numero: v.numero,
  vendeur: SEED_VENDEUR,
  lignes: v.lignes,
  total: totalLignes(v.lignes),
  modePaiement: v.modePaiement,
  montantRecu: v.montantRecu ?? totalLignes(v.lignes),
  monnaieRendue: Math.max(0, (v.montantRecu ?? totalLignes(v.lignes)) - totalLignes(v.lignes)),
  createdAt: v.createdAt,
}))

let prochainNumero = 106
const ventes = [...VENTES_INITIALES]

// Enregistre une vente encaissee et renvoie le recu correspondant. modePaiement
// est l'une des cles de MODES_PAIEMENT (voir modesPaiement.jsx) : 'wave',
// 'orange-money', 'mixx-yas', 'carte' ou 'especes'. montantRecu vaut le
// montant total pour un mode non-especes (pas de monnaie a rendre).
export function enregistrerVente({ lignes, montantRecu, modePaiement, vendeur }) {
  const total = totalLignes(lignes)
  const vente = {
    id: `vente-${prochainNumero}`,
    numero: prochainNumero,
    vendeur,
    lignes,
    total,
    modePaiement,
    montantRecu,
    monnaieRendue: Math.max(0, montantRecu - total),
    createdAt: new Date().toISOString(),
  }
  prochainNumero += 1
  ventes.unshift(vente)
  return vente
}

function estAujourdhui(iso) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

// Historique propre a un vendeur (poste de caisse individuel, voir decision
// du 13/10/2026) — les autres vendeurs ne voient pas ces ventes.
export function ventesDe(vendeur) {
  return ventes.filter((v) => v.vendeur === vendeur)
}

export function ventesDuJourDe(vendeur) {
  return ventesDe(vendeur).filter((v) => estAujourdhui(v.createdAt))
}

export function totalEncaisseDuJourDe(vendeur) {
  return ventesDuJourDe(vendeur).reduce((somme, v) => somme + v.total, 0)
}

export function nombreArticles(vente) {
  return vente.lignes.reduce((somme, l) => somme + l.quantite, 0)
}
