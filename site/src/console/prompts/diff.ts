// Différences entre deux prompts, ligne par ligne puis mot par mot. Du texte seulement :
// le résultat est rendu comme du texte React, jamais comme du HTML (DESIGN.md 5.3).

export type Op = 'egal' | 'ajout' | 'suppression'

export interface Morceau {
  op: Op
  texte: string
}

export interface LigneDiff {
  op: Op
  /** Numéro de ligne dans A (suppression, égal) et dans B (ajout, égal). */
  a?: number
  b?: number
  morceaux: Morceau[]
}

/** Plus longue sous-suite commune, puis chemin d'édition (ordre : suppressions avant ajouts). */
function lcs<T>(a: T[], b: T[]): Op[] {
  const n = a.length
  const m = b.length
  const t: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) t[i]![j] = a[i] === b[j] ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!)
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      ops.push('egal')
      i++
      j++
    } else if (i < n && (j >= m || t[i + 1]![j]! >= t[i]![j + 1]!)) {
      ops.push('suppression')
      i++
    } else {
      ops.push('ajout')
      j++
    }
  }
  return ops
}

const jetons = (s: string) => s.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []

/** Mots d'une ligne remplacée : ce qui reste, ce qui part, ce qui arrive. */
export function diffMots(avant: string, apres: string): { avant: Morceau[]; apres: Morceau[] } {
  const a = jetons(avant)
  const b = jetons(apres)
  const res = { avant: [] as Morceau[], apres: [] as Morceau[] }
  const pousser = (liste: Morceau[], op: Op, texte: string) => {
    const dernier = liste[liste.length - 1]
    if (dernier && dernier.op === op) dernier.texte += texte
    else liste.push({ op, texte })
  }
  let i = 0
  let j = 0
  for (const op of lcs(a, b)) {
    if (op === 'egal') {
      pousser(res.avant, 'egal', a[i++]!)
      pousser(res.apres, 'egal', b[j++]!)
    } else if (op === 'suppression') pousser(res.avant, 'suppression', a[i++]!)
    else pousser(res.apres, 'ajout', b[j++]!)
  }
  return res
}

/**
 * Diff unifié de deux textes. Une suite de suppressions suivie d'ajouts est appariée
 * ligne à ligne, et chaque paire est détaillée mot par mot.
 */
export function diffLignes(texteA: string, texteB: string): LigneDiff[] {
  const a = texteA.replace(/\n$/, '').split('\n')
  const b = texteB.replace(/\n$/, '').split('\n')
  const ops = lcs(a, b)
  const sortie: LigneDiff[] = []
  let i = 0
  let j = 0
  let k = 0
  while (k < ops.length) {
    if (ops[k] === 'egal') {
      sortie.push({ op: 'egal', a: i + 1, b: j + 1, morceaux: [{ op: 'egal', texte: a[i]! }] })
      i++
      j++
      k++
      continue
    }
    const sup: number[] = []
    const aj: number[] = []
    while (k < ops.length && ops[k] !== 'egal') {
      if (ops[k] === 'suppression') sup.push(i++)
      else aj.push(j++)
      k++
    }
    const paires = Math.min(sup.length, aj.length)
    const mots = sup.slice(0, paires).map((x, p) => diffMots(a[x]!, b[aj[p]!]!))
    sup.forEach((x, p) =>
      sortie.push({
        op: 'suppression',
        a: x + 1,
        morceaux: p < paires ? mots[p]!.avant : [{ op: 'suppression', texte: a[x]! }],
      }),
    )
    aj.forEach((y, p) =>
      sortie.push({ op: 'ajout', b: y + 1, morceaux: p < paires ? mots[p]!.apres : [{ op: 'ajout', texte: b[y]! }] }),
    )
  }
  return sortie
}

export type Bloc = { type: 'lignes'; lignes: LigneDiff[] } | { type: 'replie'; lignes: LigneDiff[] }

/** Garde `contexte` lignes identiques autour de chaque changement ; replie le reste. */
export function replier(lignes: LigneDiff[], contexte = 2): Bloc[] {
  const garder = lignes.map(() => false)
  lignes.forEach((l, x) => {
    if (l.op !== 'egal')
      for (let y = Math.max(0, x - contexte); y <= Math.min(lignes.length - 1, x + contexte); y++) garder[y] = true
  })
  const blocs: Bloc[] = []
  lignes.forEach((l, x) => {
    const type = garder[x] ? 'lignes' : 'replie'
    const dernier = blocs[blocs.length - 1]
    if (dernier && dernier.type === type) dernier.lignes.push(l)
    else blocs.push({ type, lignes: [l] })
  })
  return blocs
}

export function bilan(lignes: LigneDiff[]): { ajouts: number; suppressions: number } {
  return {
    ajouts: lignes.filter((l) => l.op === 'ajout').length,
    suppressions: lignes.filter((l) => l.op === 'suppression').length,
  }
}
