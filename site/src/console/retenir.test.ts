import { describe, expect, it } from 'vitest'
import { csvUneLigne } from './api'
import { graduations } from './graphiques'
import { champsFaux, duree, pct, retenirConfusion, retenirCroise, retenirPrecision, retenirRepartition } from './retenir'
import { DEMO15 } from './fixtures'

const net = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ')

describe('chiffres', () => {
  it('pourcentages et durées au format de make triage', () => {
    expect(net(pct(14, 15))).toBe('93,3 %')
    expect(pct(0, 0)).toBe('n/a')
    expect(duree(45)).toBe('45 s')
    expect(duree(95)).toBe('1 min 35 s')
    expect(duree(3720)).toBe('1 h 02 min')
  })

  it('graduations rondes', () => {
    expect(graduations(6)).toEqual([0, 2, 4, 6])
    expect(graduations(5)).toEqual([0, 1, 2, 3, 4, 5])
    expect(graduations(13)).toEqual([0, 5, 10, 15])
    expect(graduations(100)).toEqual([0, 20, 40, 60, 80, 100])
    expect(graduations(1)).toEqual([0, 1])
    expect(graduations(0)).toEqual([0, 1])
  })
})

describe('phrases à retenir (demo15)', () => {
  const a = DEMO15.analyse
  const m = a.metriques!

  it('répartition : la valeur en tête, avec son poids', () => {
    expect(retenirRepartition('categorie', a.repartitions.categorie)).toBe(
      'Incident et Autre arrivent à égalité en tête : 6 tickets chacun sur 15.',
    )
    expect(net(retenirRepartition('severite', a.repartitions.severite))).toBe(
      'Faible est la gravité la plus fréquente : 7 tickets sur 15 (47 %).',
    )
    expect(retenirRepartition('produit', { card: 2, account: 2, transfer: 1 })).toBe(
      'Carte et Compte arrivent à égalité en tête : 2 tickets chacun sur 5.',
    )
    expect(retenirRepartition('severite', { low: 0, medium: 0, high: 0 })).toBe('Aucun ticket trié pour l’instant.')
  })

  it('produit × gravité : la case la plus chargée et les gravités hautes', () => {
    expect(retenirCroise(a.repartitions.produit_x_severite)).toBe(
      'Case la plus chargée : carte en gravité faible (2 tickets). Gravité haute : 4 tickets sur 15.',
    )
  })

  it('justesse : le champ le plus faible et les tickets entièrement justes', () => {
    expect(net(retenirPrecision(m))).toBe(
      'Champ le plus faible : gravité, 13 justes sur 15 (86,7 %). Les trois champs sont justes pour 11 tickets sur 15.',
    )
  })

  it('confusion : l’erreur la plus fréquente', () => {
    expect(retenirConfusion('severite', m.fields.severite!)).toBe(
      '2 erreurs sur 15 tickets. La plus fréquente : « Moyenne » lu comme « Faible » (2 tickets).',
    )
    expect(retenirConfusion('categorie', m.fields.categorie!)).toBe(
      'Une seule erreur sur 15 tickets : « Facturation » lu comme « Autre ».',
    )
  })

  it('erreurs d’une ligne : seulement les champs dont la bonne réponse est fournie', () => {
    const juste = DEMO15.lignes[0]
    const fausse = DEMO15.lignes.find((l) => l.id === 'VAL024')
    expect(champsFaux(juste!)).toEqual([])
    expect(champsFaux(fausse!)).toEqual(['severite'])
    expect(champsFaux({ ...fausse!, attendu: {} })).toEqual([])
  })
})

describe('ticket écrit', () => {
  it('devient un CSV d’une ligne, guillemets doublés', () => {
    expect(csvUneLigne(' Mon « code » a dit "non", vite ; merci \n')).toBe(
      'ticket\r\n"Mon « code » a dit ""non"", vite ; merci"\r\n',
    )
  })
})
