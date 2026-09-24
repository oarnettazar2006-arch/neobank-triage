// Outils purs de l'onglet Pipeline (testés dans trace.test.ts). Aucun HTML n'est produit ici :
// les segments sont rendus en nœuds texte par Pipeline.tsx.

export interface Segment {
  texte: string
  /** Passage à mettre en évidence (retiré par la garde, ou ticket inséré dans un prompt). */
  marque: boolean
}

/**
 * Découpe `texte` en segments, les passages trouvés marqués. Chaque passage est cherché
 * après le précédent ; un passage introuvable (texte normalisé par la garde) est ignoré.
 */
export function surligner(texte: string, passages: string[]): Segment[] {
  const zones: [number, number][] = []
  for (const p of passages) {
    if (!p) continue
    const debut = texte.indexOf(p)
    if (debut >= 0) zones.push([debut, debut + p.length])
  }
  zones.sort((a, b) => a[0] - b[0])
  const out: Segment[] = []
  let i = 0
  for (const [d, f] of zones) {
    if (d < i) continue   // chevauchement : le premier passage l'emporte
    if (d > i) out.push({ texte: texte.slice(i, d), marque: false })
    out.push({ texte: texte.slice(d, f), marque: true })
    i = f
  }
  if (i < texte.length) out.push({ texte: texte.slice(i), marque: false })
  return out
}

/** Le prompt autour du ticket inséré : on cherche depuis la fin, là où le prompt place {ticket}. */
export function autourDuTicket(prompt: string, insere: string | undefined): Segment[] {
  if (!insere) return [{ texte: prompt, marque: false }]
  const d = prompt.lastIndexOf(insere)
  if (d < 0) return [{ texte: prompt, marque: false }]
  return [
    { texte: prompt.slice(0, d), marque: false },
    { texte: insere, marque: true },
    { texte: prompt.slice(d + insere.length), marque: false },
  ].filter((s) => s.texte)
}

/** Durée d'une étape : « 3 ms », « 420 ms », « 2,4 s ». */
export function secondesTexte(s: number | null | undefined): string {
  if (s == null) return ''
  if (s < 0.001) return 'moins d’1 ms'
  if (s < 1) return `${Math.round(s * 1000)} ms`
  return `${s.toFixed(1).replace('.', ',')} s`
}

/** La réponse brute du modèle telle quelle, et une version indentée si c'est du JSON. */
export function jsonLisible(brut: string): string {
  try {
    return JSON.stringify(JSON.parse(brut), null, 1)
  } catch {
    return brut
  }
}

export const nombreDeLignes = (t: string) => t.split('\n').length
