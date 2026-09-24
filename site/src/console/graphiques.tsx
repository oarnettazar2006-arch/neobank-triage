import { useId, type ReactNode } from 'react'

// Graphiques de la console, sans bibliothèque : du HTML et des jetons (DESIGN.md 2).
// Chaque graphique a un titre, des axes nommés, des libellés lisibles et une phrase
// « à retenir ». Une seule teinte (l'accent) pour les quantités ; --danger pour les
// erreurs, toujours avec un libellé. Survol : infobulle native sur chaque barre ou case.

/** Graduations rondes de 0 à au moins `max` (au plus 5 intervalles). */
export function graduations(max: number): number[] {
  if (max <= 0) return [0, 1]
  const puissance = 10 ** (Math.floor(Math.log10(max)) - 1)
  const pas =
    [1, 2, 5, 10, 20, 50]
      .map((k) => Math.round(k * puissance * 10) / 10)
      .find((p) => p >= 1 && Number.isInteger(p) && Math.ceil(max / p) <= 5) ?? 1
  const haut = Math.ceil(max / pas) * pas
  return Array.from({ length: haut / pas + 1 }, (_, i) => i * pas)
}

export function Figure({
  titre,
  sousTitre,
  retenir,
  legende,
  children,
  className = '',
}: {
  titre: string
  sousTitre?: string
  retenir: string
  legende?: ReactNode
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <figure aria-labelledby={id} className={`bloc m-0 flex min-w-0 flex-col p-5 ${className}`}>
      <h3 id={id} className="text-corps font-semibold text-text">
        {titre}
      </h3>
      {sousTitre && <p className="mt-0.5 text-petit text-text-2">{sousTitre}</p>}
      {legende && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-petit text-text-2">{legende}</div>}
      <div className="mt-4 flex-1">{children}</div>
      <figcaption className="mt-4 border-t border-line pt-3 text-petit text-text">
        <span className="font-semibold">À retenir : </span>
        {retenir}
      </figcaption>
    </figure>
  )
}

export function Pastille({ couleur, children }: { couleur: 'accent' | 'danger'; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block size-2.5 rounded-[3px] ${couleur === 'accent' ? 'bg-accent' : 'bg-danger'}`}
      />
      {children}
    </span>
  )
}

export interface Barre {
  cle: string
  libelle: string
  valeur: number
  /** Texte au bout de la barre : « 6 · 40 % ». */
  texte: string
  infobulle: string
}

/** Barres horizontales, une seule série : l'axe des valeurs en bas, nommé, avec des graduations rondes. */
export function Barres({
  barres,
  max,
  axe,
  formatGraduation = String,
  graduationsFixes,
}: {
  barres: Barre[]
  max: number
  axe: string
  formatGraduation?: (v: number) => string
  graduationsFixes?: number[]
}) {
  const grads = graduationsFixes ?? graduations(max)
  const haut = grads[grads.length - 1] ?? 1
  // La zone des barres laisse 76 px à droite pour le libellé de la plus longue.
  const x = (v: number) => `calc((100% - 76px) * ${v / haut})`
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-3">
      {barres.map((b) => (
        <div key={b.cle} className="contents">
          <span className="flex h-8 items-center truncate text-petit text-text-2">{b.libelle}</span>
          <div className="relative h-8" title={b.infobulle}>
            {grads.map((g) => (
              <span key={g} aria-hidden="true" className="absolute inset-y-0 w-px bg-line" style={{ left: x(g) }} />
            ))}
            {b.valeur > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-2 h-4 rounded-r-[4px] bg-accent"
                style={{ left: 0, width: x(b.valeur) }}
              />
            )}
            <span
              className="montant absolute top-0 flex h-8 items-center pl-1.5 text-petit font-medium text-text"
              style={{ left: x(b.valeur) }}
            >
              {b.texte}
            </span>
          </div>
        </div>
      ))}
      <span />
      <div aria-hidden="true" className="relative mt-1 h-4">
        {grads.map((g) => (
          <span
            key={g}
            className="montant absolute -translate-x-1/2 text-[0.75rem] leading-4 text-text-2"
            style={{ left: x(g) }}
          >
            {formatGraduation(g)}
          </span>
        ))}
      </div>
      <span />
      <p className="mt-1 text-[0.75rem] text-text-2">{axe}</p>
    </div>
  )
}

export interface Case {
  n: number
  /** 0 à 1 : opacité de la teinte. */
  intensite: number
  ton: 'accent' | 'danger' | 'vide'
  infobulle: string
}

/**
 * Tableau à double entrée coloré (carte de chaleur, matrice de confusion).
 * Les axes sont nommés en tête de ligne et de colonne ; chaque case porte son nombre.
 */
export function Grille({
  axeLignes,
  axeColonnes,
  lignes,
  colonnes,
  cases,
  totaux = false,
}: {
  axeLignes: string
  axeColonnes: string
  lignes: { cle: string; libelle: string }[]
  colonnes: { cle: string; libelle: string }[]
  cases: (ligne: string, colonne: string) => Case
  totaux?: boolean
}) {
  const somme = (f: (l: string, c: string) => number, ls: string[], cs: string[]) =>
    ls.reduce((a, l) => a + cs.reduce((b, c) => b + f(l, c), 0), 0)
  const n = (l: string, c: string) => cases(l, c).n
  const cl = colonnes.map((c) => c.cle)
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-[2px] text-petit">
        <thead>
          <tr>
            <th scope="col" className="w-[104px] pb-1 text-left align-bottom text-[0.75rem] font-medium text-text-2">
              {axeLignes}
            </th>
            <th
              scope="colgroup"
              colSpan={colonnes.length}
              className="pb-1 text-center text-[0.75rem] font-medium text-text-2"
            >
              {axeColonnes}
            </th>
            {totaux && <th />}
          </tr>
          <tr>
            <td />
            {colonnes.map((c) => (
              <th key={c.cle} scope="col" className="h-7 px-1 text-center font-medium text-text">
                {c.libelle}
              </th>
            ))}
            {totaux && (
              <th scope="col" className="px-1 text-center font-medium text-text-2">
                Total
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.cle}>
              <th scope="row" className="truncate pr-2 text-left font-medium text-text">
                {l.libelle}
              </th>
              {colonnes.map((c) => {
                const k = cases(l.cle, c.cle)
                const fonce = k.ton !== 'vide' && k.intensite > 0.55
                const fond =
                  k.ton === 'vide'
                    ? undefined
                    : `rgb(var(--${k.ton === 'accent' ? 'accent' : 'danger'}-rgb) / ${(0.1 + 0.8 * k.intensite).toFixed(2)})`
                return (
                  <td
                    key={c.cle}
                    title={k.infobulle}
                    className={`montant h-10 min-w-10 rounded-[6px] text-center ${
                      k.ton === 'vide' ? 'bg-surface-2 text-text-2' : fonce ? 'font-semibold text-on-accent' : 'font-semibold text-text'
                    }`}
                    style={fond ? { background: fond } : undefined}
                  >
                    {k.n}
                  </td>
                )
              })}
              {totaux && <td className="montant text-center text-text-2">{somme(n, [l.cle], cl)}</td>}
            </tr>
          ))}
          {totaux && (
            <tr>
              <th scope="row" className="pr-2 text-left font-medium text-text-2">
                Total
              </th>
              {colonnes.map((c) => (
                <td key={c.cle} className="montant h-8 text-center text-text-2">
                  {somme(n, lignes.map((l) => l.cle), [c.cle])}
                </td>
              ))}
              <td className="montant text-center font-semibold text-text">
                {somme(n, lignes.map((l) => l.cle), cl)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Chiffre clé : libellé, valeur, précision en petit (DESIGN.md 3, montant fort). */
export function Chiffre({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="bloc min-w-0 px-5 py-4">
      <p className="text-petit text-text-2">{libelle}</p>
      <p className="mt-1 text-[1.5rem] leading-8 font-semibold tracking-[-0.02em] text-text">
        {valeur}
      </p>
      {detail && <p className="text-petit text-text-2">{detail}</p>}
    </div>
  )
}
