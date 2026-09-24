import { describe, expect, it } from 'vitest'
import { bilan, diffLignes, diffMots, replier } from './diff'

describe('diff des prompts', () => {
  it('textes identiques : aucune ligne ajoutée ni supprimée', () => {
    const d = diffLignes('a\nb\n', 'a\nb\n')
    expect(bilan(d)).toEqual({ ajouts: 0, suppressions: 0 })
    expect(replier(d)).toEqual([{ type: 'replie', lignes: d }])
  })

  it('ajout et suppression de lignes, avec leurs numéros', () => {
    const d = diffLignes('un\ndeux\ntrois', 'un\ntrois\nquatre')
    expect(d.map((l) => [l.op, l.a, l.b])).toEqual([
      ['egal', 1, 1],
      ['suppression', 2, undefined],
      ['egal', 3, 2],
      ['ajout', undefined, 3],
    ])
    expect(bilan(d)).toEqual({ ajouts: 1, suppressions: 1 })
  })

  it('ligne modifiée : seuls les mots changés sont surlignés', () => {
    const { avant, apres } = diffMots('- severity : low, medium ou high', '- severity : low, medium ou high (en cas de doute : medium)')
    expect(avant).toEqual([{ op: 'egal', texte: '- severity : low, medium ou high' }])
    expect(apres).toEqual([
      { op: 'egal', texte: '- severity : low, medium ou high' },
      { op: 'ajout', texte: ' (en cas de doute : medium)' },
    ])
  })

  it('replie les longues suites identiques, garde 2 lignes de contexte', () => {
    const a = Array.from({ length: 20 }, (_, i) => `l${i}`)
    const b = [...a]
    b[10] = 'changée'
    const blocs = replier(diffLignes(a.join('\n'), b.join('\n')))
    expect(blocs.map((x) => [x.type, x.lignes.length])).toEqual([
      ['replie', 8],
      ['lignes', 6],
      ['replie', 7],
    ])
  })

  it('le texte reste du texte : aucune balise n’est interprétée ici', () => {
    const d = diffLignes('<ticket>', '<ticket>\n<img src=x onerror=alert(1)>')
    expect(d[1]!.morceaux[0]!.texte).toBe('<img src=x onerror=alert(1)>')
  })
})
