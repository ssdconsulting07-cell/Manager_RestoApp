import { describe, expect, it } from 'vitest'
import { ETATS, evaluerEtat, messageTransition } from './reseau.js'

const ok = (duree = 120) => ({ ok: true, duree })
const ko = () => ({ ok: false, duree: 5000 })

describe('evaluerEtat', () => {
  it('reste en ligne sans echantillon', () => {
    expect(evaluerEtat({ echantillons: [] })).toBe(ETATS.EN_LIGNE)
  })

  it('passe hors ligne des que le navigateur le signale', () => {
    expect(evaluerEtat({ enLigneNavigateur: false, echantillons: [ok(), ok()] })).toBe(ETATS.HORS_LIGNE)
  })

  it('un seul echec ne change pas l etat (attente de confirmation)', () => {
    expect(evaluerEtat({ echantillons: [ok(), ok(), ko()], etatCourant: ETATS.EN_LIGNE })).toBe(ETATS.EN_LIGNE)
  })

  it('deux echecs d affilee : hors ligne', () => {
    expect(evaluerEtat({ echantillons: [ok(), ko(), ko()] })).toBe(ETATS.HORS_LIGNE)
  })

  it('retour du reseau apres une coupure : en ligne des la premiere reponse rapide', () => {
    expect(evaluerEtat({ echantillons: [ok(), ko(), ko(), ok()], etatCourant: ETATS.HORS_LIGNE })).toBe(ETATS.EN_LIGNE)
  })

  it('coupures intermittentes (ok / echec qui alternent) : instable', () => {
    expect(evaluerEtat({ echantillons: [ok(), ko(), ok(), ko(), ok()] })).toBe(ETATS.INSTABLE)
  })

  it('reponses lentes : instable', () => {
    expect(evaluerEtat({ echantillons: [ok(), ok(3200), ok(4100)] })).toBe(ETATS.INSTABLE)
  })

  it('une seule reponse lente ne suffit pas', () => {
    expect(evaluerEtat({ echantillons: [ok(), ok(3200), ok()] })).toBe(ETATS.EN_LIGNE)
  })

  it('reseau 2G annonce par le navigateur : instable', () => {
    expect(evaluerEtat({ echantillons: [ok()], typeConnexion: '2g' })).toBe(ETATS.INSTABLE)
  })
})

describe('messageTransition', () => {
  it('rien a dire sans changement', () => {
    expect(messageTransition(ETATS.EN_LIGNE, ETATS.EN_LIGNE)).toBeNull()
  })

  it('hors ligne : erreur', () => {
    expect(messageTransition(ETATS.EN_LIGNE, ETATS.HORS_LIGNE)).toMatchObject({ type: 'erreur' })
  })

  it('instable : alerte, formulee differemment au retour d une coupure', () => {
    expect(messageTransition(ETATS.EN_LIGNE, ETATS.INSTABLE).texte).toMatch(/instable/)
    expect(messageTransition(ETATS.HORS_LIGNE, ETATS.INSTABLE).texte).toMatch(/revenue/)
  })

  it('retour a la normale : succes « Connexion rétablie. »', () => {
    expect(messageTransition(ETATS.HORS_LIGNE, ETATS.EN_LIGNE)).toEqual({ type: 'succes', texte: 'Connexion rétablie.' })
    expect(messageTransition(ETATS.INSTABLE, ETATS.EN_LIGNE)).toEqual({ type: 'succes', texte: 'Connexion rétablie.' })
  })
})
