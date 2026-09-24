import { describe, expect, it } from 'vitest'
import evolution from '../../../../eval/evolution.json'
import { commandeDiff, phraseEcart, points, retenirCourbes, retenirFinal, serie } from './evolution'
import type { Evolution } from './types'

const EVO = evolution as unknown as Evolution
const V = Object.fromEntries(EVO.versions.map((v) => [v.version, v]))

describe('séries (eval/evolution.json réel)', () => {
  it('une série par jeu : val60 a les 8 versions, v6 reprend la mesure v5', () => {
    const s = serie(EVO.versions, 'val60', 'entierement_justes')
    expect(s.map((p) => p.justes)).toEqual([7, 20, 19, 24, 30, 31, 31, 37])
    expect(s[6]!.reprise).toBe('v5')
  })

  it('une version non mesurée reste un trou, jamais une valeur d’un autre jeu', () => {
    const s = serie(EVO.versions, 'dev40', 'label')
    expect(s[7]).toEqual({ version: 'v7', valeur: null })
  })
})

describe('phrases', () => {
  it('points avec virgule et signe', () => {
    expect(points(0.1)).toBe('+10 points')
    expect(points(-0.0167)).toBe('−1,7 point')
  })

  it('à retenir sur val60 : départ, arrivée, plus grand pas', () => {
    expect(retenirCourbes(EVO, 'val60')).toBe(
      'Sur val60, les tickets entièrement justes passent de 11,7 % en v0 à 61,7 % en v7. ' +
        'Le plus grand pas : v0 → v1 (définitions du guide, +21,7 points).',
    )
  })

  it('à retenir sur dev40 : signale la version absente', () => {
    expect(retenirCourbes(EVO, 'dev40')).toContain('v7 : non mesurée sur ce jeu.')
  })

  it('à retenir sur holdout20 : un champ qui recule, et la taille du jeu', () => {
    const r = retenirCourbes(EVO, 'holdout20')
    expect(r).toContain('Catégorie : 70,0 % en v1, mais 55,0 % en v7.')
    expect(r).toContain('Sur 20 tickets, un ticket vaut 5 points : prudence.')
  })

  it('effet de la v1 sur val60', () => {
    expect(phraseEcart(V.v1!.effet.val60!.champs.entierement_justes)).toBe(
      '11,7 % → 33,3 % (+21,7 points ; 16 corrigés, 3 cassés ; p = 0,004)',
    )
  })

  it('note finale test100', () => {
    expect(retenirFinal(EVO.final)).toContain('62,0 % de tickets entièrement justes contre 8,0 % pour la v0')
  })

  it('commande Git du comparateur : tag si la version en a un', () => {
    expect(commandeDiff(V.v0!, V.v7!)).toBe('git diff 998e7d4:prompts/v0_baseline.txt v7-final:prompts/v7_sous_motif.txt')
  })
})
