import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import demo from '../../../api/donnees_demo.json'
import type { Ressource } from '../api'
import type { Compte, Operations } from '../donnees/types'
import { Accueil } from './Accueil'

// Les données de démo servies par l'API (api/donnees_demo.json) ; leur cohérence est testée côté API.
const compte = demo.compte as Compte
const operations = demo.operations as Operations
const rien = () => {}

function rendre(c: Ressource<Compte>, o: Ressource<Operations>) {
  return renderToStaticMarkup(
    <Accueil compte={c} operations={o} rechargerCompte={rien} rechargerOperations={rien} />,
  ).replace(/[\u202f\u00a0]/g, ' ')
}

const pret = rendre({ etat: 'pret', donnees: compte }, { etat: 'pret', donnees: operations })

describe('Accueil chargé', () => {
  it('affiche le bandeau de démo', () => {
    expect(pret).toContain('Démo, données fictives')
  })

  it('affiche le solde et toutes les opérations', () => {
    expect(pret).toContain('2 318')
    for (const op of operations.jours.flatMap((j) => j.operations)) expect(pret).toContain(op.libelle)
  })

  it('propose les trois actions rapides et le bouton du chat', () => {
    for (const action of ['Virement', 'Ajouter de l’argent', 'Carte']) expect(pret).toContain(action)
    expect(pret).toContain('Ouvrir l’assistance')
  })

  it('n’écrit aucun tiret cadratin', () => {
    expect(pret).not.toMatch(/[—–]/)
  })
})

describe('états (DESIGN.md 7)', () => {
  it('chargement : squelettes, aucune donnée', () => {
    const html = rendre({ etat: 'chargement' }, { etat: 'chargement' })
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('2 318')
  })

  it('vide : « Aucune opération pour l’instant. »', () => {
    const html = rendre({ etat: 'pret', donnees: compte }, { etat: 'pret', donnees: { jours: [] } })
    expect(html).toContain('Aucune opération pour l’instant.')
  })

  it('erreur : message et « Réessayer » dans le bloc, les autres blocs restent', () => {
    const html = rendre({ etat: 'pret', donnees: compte }, { etat: 'erreur' })
    expect(html).toContain('Le service ne répond pas. Réessayez dans un instant.')
    expect(html).toContain('Réessayer')
    expect(html).toContain('2 318')
  })
})

describe('chat', () => {
  it('limite la longueur du message comme l’API', () => {
    expect(pret).toMatch(/<textarea[^>]*maxLength="2000"/i)
  })

  it('rend un texte piégé comme du texte, jamais comme du HTML', () => {
    const piege = { ...compte, client: { ...compte.client, prenom: '<img src=x onerror=alert(1)>' } }
    const html = rendre({ etat: 'pret', donnees: piege }, { etat: 'pret', donnees: operations })
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x')
  })
})
