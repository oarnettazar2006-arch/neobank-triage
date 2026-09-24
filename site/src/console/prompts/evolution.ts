import type { Champ, Ecart, Evolution, Jeu, Mesure, Version } from './types'

// Chiffres et phrases de l'onglet « Prompts ». Fonctions pures, testées (evolution.test.ts) :
// la phrase « à retenir » dit toujours la même chose que le graphique.

export type Cle = Champ | 'entierement_justes'

export const LIBELLE: Record<Cle, string> = {
  label: 'Catégorie',
  product: 'Produit',
  severity: 'Gravité',
  is_complaint: 'Réclamation',
  unauthorized_payment: 'Paiement non autorisé',
  entierement_justes: 'Tickets entièrement justes',
}

/** Nom du champ dans le schéma, affiché sous le libellé français. */
export const CODE: Record<Cle, string> = {
  label: 'label',
  product: 'product',
  severity: 'severity',
  is_complaint: 'is_complaint',
  unauthorized_payment: 'unauthorized_payment',
  entierement_justes: 'les 5 champs',
}

export const CLES: Cle[] = ['entierement_justes', 'label', 'product', 'severity', 'is_complaint', 'unauthorized_payment']

const virgule = (x: string) => x.replace('.', ',')
/** 0.6167 → « 61,7 % » */
export const pc = (x: number) => `${virgule((100 * x).toFixed(1))} %`
/** 0.1 → « +10 points », -0.0167 → « −1,7 point » */
export function points(d: number): string {
  const v = Math.round(1000 * d) / 10
  if (v === 0) return '0 point'
  const abs = virgule(String(Math.abs(v)))
  return `${v > 0 ? '+' : '−'}${abs} point${Math.abs(v) >= 2 ? 's' : ''}`
}
export const pValeur = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${virgule(p.toFixed(3))}`)
const s = (n: number) => (n > 1 ? 's' : '')

export function compte(m: Mesure, cle: Cle) {
  return cle === 'entierement_justes' ? m.entierement_justes : m.champs[cle]
}

export interface Point {
  version: string
  valeur: number | null
  justes?: number
  n?: number
  reprise?: string
}

/** Une série = un champ, sur un seul jeu. Une version non mesurée sur ce jeu reste un trou. */
export function serie(versions: Version[], jeu: Jeu, cle: Cle): Point[] {
  return versions.map((v) => {
    const m = v.mesures[jeu]
    if (!m) return { version: v.version, valeur: null }
    const c = compte(m, cle)
    return { version: v.version, valeur: c.justes / c.n, justes: c.justes, n: c.n, reprise: m.reprise_de }
  })
}

/** Effet d'une version en une ligne : « 40,0 % → 50,0 % (+10 points ; 9 corrigés, 3 cassés ; p = 0,146) ». */
export function phraseEcart(e: Ecart): string {
  return `${pc(e.avant)} → ${pc(e.apres)} (${points(e.apres - e.avant)} ; ${e.corriges} corrigé${s(e.corriges)}, ${e.casses} cassé${s(e.casses)} ; ${pValeur(e.p)})`
}

/** Les champs dont l'écart est significatif (McNemar, p < 0,05), avec leur sens. */
export function significatifs(champs: Record<Cle, Ecart>): string[] {
  return (Object.keys(LIBELLE) as Cle[])
    .filter((k) => k !== 'entierement_justes' && champs[k] && champs[k].p < 0.05)
    .map((k) => `${LIBELLE[k].toLowerCase()} ${points(champs[k].apres - champs[k].avant)} (${pValeur(champs[k].p)})`)
}

export function retenirCourbes(evo: Evolution, jeu: Jeu): string {
  const pts = serie(evo.versions, jeu, 'entierement_justes').filter((p) => p.valeur !== null && !p.reprise)
  const premier = pts[0]
  const dernier = pts[pts.length - 1]
  if (!premier || !dernier || pts.length < 2) return 'Pas assez de versions mesurées sur ce jeu.'
  let pas = { de: premier, a: premier, d: -Infinity }
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i]!.valeur! - pts[i - 1]!.valeur!
    if (d > pas.d) pas = { de: pts[i - 1]!, a: pts[i]!, d }
  }
  const titre = evo.versions.find((v) => v.version === pas.a.version)?.titre.toLowerCase() ?? ''
  let phrase =
    `Sur ${jeu}, les tickets entièrement justes passent de ${pc(premier.valeur!)} en ${premier.version} ` +
    `à ${pc(dernier.valeur!)} en ${dernier.version}. Le plus grand pas : ${pas.de.version} → ${pas.a.version} ` +
    `(${titre}, ${points(pas.d)}).`
  const max = pts.reduce((a, b) => (b.valeur! > a.valeur! ? b : a))
  if (max.valeur! > dernier.valeur!) phrase += ` Le maximum (${pc(max.valeur!)}) est atteint en ${max.version}, pas en ${dernier.version}.`
  for (const cle of CLES.slice(1)) {
    const c = serie(evo.versions, jeu, cle).filter((p) => p.valeur !== null && !p.reprise)
    const fin = c[c.length - 1]!
    const haut = c.reduce((a, b) => (b.valeur! > a.valeur! ? b : a))
    if (haut.valeur! - fin.valeur! >= 0.1)
      phrase += ` ${LIBELLE[cle]} : ${pc(haut.valeur!)} en ${haut.version}, mais ${pc(fin.valeur!)} en ${fin.version}.`
  }
  const n = pts[0]!.n ?? 0
  if (n && n <= 20) phrase += ` Sur ${n} tickets, un ticket vaut ${Math.round(100 / n)} points : prudence.`
  const manque = evo.versions.filter((v) => !v.mesures[jeu]).map((v) => v.version)
  if (manque.length) phrase += ` ${manque.join(', ')} : non mesurée${s(manque.length)} sur ce jeu.`
  return phrase
}

export function retenirFinal(f: Evolution['final']): string {
  const e = f.effet.entierement_justes
  const sig = significatifs(f.effet)
  return (
    `Sur ${f.n} tickets jamais vus, la v7 donne ${pc(e.apres)} de tickets entièrement justes contre ${pc(e.avant)} pour la v0 ` +
    `(${e.corriges} corrigés, ${e.casses} cassé${s(e.casses)} ; ${pValeur(e.p)}). ` +
    `Gains significatifs : ${sig.join(', ')}. Attaques obtenues : ${f.v0.attaques.obtenues} sur ${f.v0.attaques.n} en v0, ` +
    `${f.v7.attaques.obtenues} sur ${f.v7.attaques.n} en v7.`
  )
}

/** Référence Git d'une version : son tag s'il existe, sinon son commit. */
export const refGit = (v: Version) => v.tags[0]?.nom ?? v.commit_court

/** La commande qui montre, dans un terminal, le diff affiché par le comparateur. */
export function commandeDiff(a: Version, b: Version): string {
  return `git diff ${refGit(a)}:${a.prompt} ${refGit(b)}:${b.prompt}`
}
