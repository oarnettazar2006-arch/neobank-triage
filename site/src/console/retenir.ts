import { CHAMP, COLONNES, libelle } from './libelles'
import type { Colonne, Ligne, MetriqueChamp, Metriques } from './types'

// Chiffres et phrases « à retenir » sous chaque graphique. Fonctions pures, testées
// (retenir.test.ts) : la phrase dit toujours la même chose que le graphique.

const pourcent = new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const pourcentRond = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

/** 14, 15 → « 93,3 % » */
export const pct = (k: number, n: number) => (n ? pourcent.format(k / n) : 'n/a')
/** 6, 15 → « 40 % » */
export const pctRond = (k: number, n: number) => (n ? pourcentRond.format(k / n) : 'n/a')

/** Même format que eval/triage_csv.py : « 45 s », « 1 min 35 s », « 1 h 02 min ». */
export function duree(secondes: number): string {
  let s = Math.round(secondes)
  if (s < 60) return `${s} s`
  let m = Math.floor(s / 60)
  s %= 60
  if (m < 60) return `${m} min ${String(s).padStart(2, '0')} s`
  const h = Math.floor(m / 60)
  m %= 60
  return `${h} h ${String(m).padStart(2, '0')} min`
}

const tickets = (n: number) => `${n} ticket${n > 1 ? 's' : ''}`

/** « A », « A et B », « A, B et C » */
function liste(mots: string[]): string {
  return mots.length <= 1 ? (mots[0] ?? '') : `${mots.slice(0, -1).join(', ')} et ${mots[mots.length - 1]}`
}

const PLUS_FREQUENT: Record<Colonne, string> = {
  categorie: 'la catégorie la plus fréquente',
  produit: 'le produit le plus fréquent',
  severite: 'la gravité la plus fréquente',
}

export function retenirRepartition(col: Colonne, comptes: Record<string, number>): string {
  const total = Object.values(comptes).reduce((a, b) => a + b, 0)
  if (!total) return 'Aucun ticket trié pour l’instant.'
  const max = Math.max(...Object.values(comptes))
  const tete = Object.keys(comptes).filter((k) => comptes[k] === max)
  const noms = liste(tete.map((k) => libelle(col, k)))
  if (tete.length > 1) return `${noms} arrivent à égalité en tête : ${tickets(max)} chacun sur ${total}.`
  return `${noms} est ${PLUS_FREQUENT[col]} : ${tickets(max)} sur ${total} (${pctRond(max, total)}).`
}

export function retenirCroise(croise: Record<string, Record<string, number>>): string {
  let meilleur = { produit: '', severite: '', n: 0 }
  let hautes = 0
  let total = 0
  for (const [produit, ligne] of Object.entries(croise)) {
    for (const [severite, n] of Object.entries(ligne)) {
      total += n
      if (severite === 'high') hautes += n
      if (n > meilleur.n) meilleur = { produit, severite, n }
    }
  }
  if (!total) return 'Aucun ticket trié pour l’instant.'
  const caseMax = `${libelle('produit', meilleur.produit).toLowerCase()} en gravité ${libelle('severite', meilleur.severite).toLowerCase()}`
  return `Case la plus chargée : ${caseMax} (${tickets(meilleur.n)}). Gravité haute : ${tickets(hautes)} sur ${total}.`
}

export function retenirPrecision(m: Metriques): string {
  const champs = COLONNES.flatMap((c) => {
    const f = m.fields[c]
    return f ? [{ c, f }] : []
  })
  const e = m.exact
  if (champs.every(({ f }) => f.correct === f.n)) return `Aucune erreur : les ${tickets(e.n)} notés sont entièrement justes.`
  const faible = champs.reduce((a, b) => (b.f.correct / b.f.n < a.f.correct / a.f.n ? b : a))
  const phrase = `Champ le plus faible : ${CHAMP[faible.c].toLowerCase()}, ${faible.f.correct} justes sur ${faible.f.n} (${pct(faible.f.correct, faible.f.n)}).`
  if (e.over.length < 2) return phrase
  return `${phrase} Les ${e.over.length === 3 ? 'trois' : 'deux'} champs sont justes pour ${e.correct} tickets sur ${e.n}.`
}

/** L'erreur la plus fréquente d'une matrice de confusion (hors diagonale), ou null. */
export function pireConfusion(f: MetriqueChamp): { vraie: string; predite: string; n: number } | null {
  let pire: { vraie: string; predite: string; n: number } | null = null
  for (const vraie of f.labels)
    for (const predite of f.labels) {
      const n = f.matrix[vraie]?.[predite] ?? 0
      if (vraie !== predite && n > 0 && (!pire || n > pire.n)) pire = { vraie, predite, n }
    }
  return pire
}

export function retenirConfusion(col: Colonne, f: MetriqueChamp): string {
  const pire = pireConfusion(f)
  if (!pire) return `Aucune erreur sur les ${tickets(f.n)} notés.`
  const erreurs = f.n - f.correct
  const confusion = `« ${libelle(col, pire.vraie)} » lu comme « ${libelle(col, pire.predite)} »`
  if (erreurs === 1) return `Une seule erreur sur ${tickets(f.n)} : ${confusion}.`
  return `${erreurs} erreurs sur ${tickets(f.n)}. La plus fréquente : ${confusion} (${tickets(pire.n)}).`
}

/** Champs faux d'une ligne (seulement ceux dont la bonne réponse est fournie). */
export function champsFaux(l: Ligne): Colonne[] {
  const p = l.prediction
  if (!p) return []
  const predit = { categorie: p.categorie_predite, produit: p.produit_predit, severite: p.severite_predite }
  return COLONNES.filter((c) => l.attendu[c] !== undefined && l.attendu[c] !== predit[c])
}
