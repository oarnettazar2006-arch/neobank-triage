import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { accueil } from '../donnees/accueil'
import { Accueil } from './Accueil'

const html = renderToStaticMarkup(<Accueil donnees={accueil} />).replace(/[\u202f\u00a0]/g, ' ')
const operations = accueil.jours.flatMap((j) => j.operations)

describe('données fictives', () => {
  it('compte une quinzaine d’opérations, toutes différentes', () => {
    expect(operations.length).toBeGreaterThanOrEqual(15)
    expect(new Set(operations.map((o) => o.id)).size).toBe(operations.length)
  })

  it('résume septembre avec la somme exacte des opérations du mois', () => {
    const septembre = accueil.jours.filter((j) => !j.libelle.includes('août')).flatMap((j) => j.operations)
    const depenses = -septembre.filter((o) => o.montant < 0).reduce((s, o) => s + o.montant, 0)
    const revenus = septembre.filter((o) => o.montant > 0).reduce((s, o) => s + o.montant, 0)
    expect(accueil.mois.depenses).toBe(depenses)
    expect(accueil.mois.revenus).toBe(revenus)
  })
})

describe('Accueil', () => {
  it('affiche le bandeau de démo', () => {
    expect(html).toContain('Démo, données fictives')
  })

  it('affiche le solde et toutes les opérations', () => {
    expect(html).toContain('2 318')
    for (const op of operations) expect(html).toContain(op.libelle)
  })

  it('propose les trois actions rapides et le bouton du chat', () => {
    for (const action of ['Virement', 'Ajouter de l’argent', 'Carte']) expect(html).toContain(action)
    expect(html).toContain('Ouvrir l’assistance')
  })

  it('n’écrit aucun tiret cadratin', () => {
    expect(html).not.toMatch(/[—–]/)
  })
})
