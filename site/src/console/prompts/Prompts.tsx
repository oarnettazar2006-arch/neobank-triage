import { ArrowsLeftRightIcon, CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { BASE, useRessource } from '../../api'
import { ErreurBloc, Os } from '../../composants/Etats'
import { Chiffre, Figure } from '../graphiques'
import { bilan, diffLignes, replier, type LigneDiff } from './diff'
import {
  CLES,
  CODE,
  commandeDiff,
  compte,
  LIBELLE,
  pc,
  phraseEcart,
  points,
  pValeur,
  retenirCourbes,
  retenirFinal,
  serie,
  significatifs,
  type Cle,
  type Point,
} from './evolution'
import type { Evolution, Jeu, Version } from './types'

// Onglet « Prompts » de la console : l'histoire des prompts de tri v0 à v7, lue dans
// eval/evolution.json (GET /evolution). Tout ce qui vient d'un prompt est rendu comme
// du texte React, jamais comme du HTML (DESIGN.md 5.3).

async function chargerEvolution(signal: AbortSignal): Promise<Evolution> {
  const r = await fetch(`${BASE}/evolution`, { signal })
  if (!r.ok) throw new Error(`/evolution : HTTP ${r.status}`)
  return (await r.json()) as Evolution
}

const JEUX: Jeu[] = ['val60', 'holdout20', 'dev40']
/** « 2026-09-23 » → « 23/09/2026 », sans Date (le front ne calcule aucune date). */
const dateFr = (iso: string) => iso.split('-').reverse().join('/')

function Titre({ id, children, detail }: { id: string; children: ReactNode; detail?: ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 id={id} className="text-section font-semibold tracking-[-0.01em] text-text">
        {children}
      </h2>
      {detail && <p className="max-w-[72ch] text-petit text-text-2">{detail}</p>}
    </div>
  )
}

function Etiquette({ ton = 'neutre', children }: { ton?: 'neutre' | 'accent'; children: ReactNode }) {
  const fond = ton === 'accent' ? 'bg-[rgb(var(--accent-rgb)/0.12)]' : 'bg-surface-2'
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.75rem] leading-4 font-medium text-text ${fond}`}>{children}</span>
}

function Copier({ texte }: { texte: string }) {
  const [fait, setFait] = useState(false)
  const copier = () => {
    navigator.clipboard?.writeText(texte).then(
      () => {
        setFait(true)
        setTimeout(() => setFait(false), 1500)
      },
      () => {},
    )
  }
  return (
    <button
      type="button"
      onClick={copier}
      aria-label={fait ? 'Commande copiée' : 'Copier la commande'}
      title={fait ? 'Copié' : 'Copier'}
      className="pressable survol grid size-8 shrink-0 place-items-center rounded-full text-text-2"
    >
      {fait ? <CheckIcon size={16} aria-hidden="true" /> : <CopyIcon size={16} aria-hidden="true" />}
    </button>
  )
}

function Commande({ commande }: { commande: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-[10px] bg-surface-2 py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-[0.75rem] leading-5 whitespace-pre text-text">{commande}</code>
      <Copier texte={commande} />
    </div>
  )
}

// --- 1. Frise ----------------------------------------------------------------------

function EffetVersion({ v, precedente }: { v: Version; precedente?: Version }) {
  const m = v.mesures.val60!
  const e = v.effet.val60
  const att = m.attaques
  if (!precedente)
    return (
      <p>
        Point de départ : <span className="montant font-semibold">{pc(m.entierement_justes.justes / m.n)}</span> de tickets
        entièrement justes, catégorie juste pour <span className="montant">{pc(m.champs.label.justes / m.n)}</span>.
        Attaques obtenues : <span className="montant">{att.obtenues} sur {att.n}</span>.
      </p>
    )
  if (!e)
    return (
      <p>
        Aucun sur le tri : il est identique à la {m.reprise_de}, la mesure est la même (
        <span className="montant">{pc(m.entierement_justes.justes / m.n)}</span> entièrement justes).
      </p>
    )
  const sig = significatifs(e.champs)
  const attAvant = precedente.mesures.val60!.attaques
  return (
    <div className="space-y-1.5">
      <p>
        Entièrement justes : <span className="font-semibold [font-variant-numeric:tabular-nums]">{phraseEcart(e.champs.entierement_justes)}</span>
      </p>
      <p className="text-text-2">
        {sig.length ? `Écarts significatifs : ${sig.join(', ')}.` : 'Aucun champ ne bouge de façon significative (McNemar, p ≥ 0,05).'}
      </p>
      <p className="text-text-2">
        Attaques obtenues : <span className="montant">{attAvant.obtenues} → {att.obtenues} sur {att.n}</span>.
      </p>
      {v.note && <p className="text-text-2">{v.note}</p>}
    </div>
  )
}

function Frise({ versions }: { versions: Version[] }) {
  return (
    <section aria-labelledby="titre-frise" className="space-y-4">
      <Titre
        id="titre-frise"
        detail="Une étape par version : ce qui a changé, l’erreur observée qui l’a motivé, et l’effet mesuré sur val60 contre la version précédente (McNemar exact apparié)."
      >
        De v0 à v7
      </Titre>
      <ol className="bloc divide-y divide-line px-5">
        {versions.map((v, i) => (
          <li key={v.version} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 py-5">
            <div className="flex flex-col items-center">
              <span
                className={`montant grid size-9 place-items-center rounded-full text-petit font-semibold ${
                  v.change_le_prompt_de_tri ? 'bg-accent text-on-accent' : 'border-2 border-accent text-accent'
                }`}
              >
                {v.version}
              </span>
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-corps font-semibold text-text">{v.titre}</h3>
                {!v.change_le_prompt_de_tri && <Etiquette>Prompt de tri inchangé</Etiquette>}
                {v.tags.map((t) => (
                  <Etiquette key={t.nom} ton="accent">
                    tag {t.nom}
                  </Etiquette>
                ))}
                <span className="montant text-[0.75rem] text-text-2">
                  commit {v.commit_court} · {dateFr(v.date)}
                  {v.pr ? ` · PR #${v.pr}` : ''}
                </span>
              </div>
              <div className="grid gap-4 text-petit text-text md:grid-cols-3">
                <div>
                  <p className="mb-1 text-[0.75rem] font-medium text-text-2">Changement</p>
                  <p>{v.changement}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.75rem] font-medium text-text-2">Pourquoi</p>
                  <p>{v.raison}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.75rem] font-medium text-text-2">
                    {i === 0 ? 'Mesure (val60)' : `Effet mesuré (val60, contre ${versions[i - 1]!.version})`}
                  </p>
                  <EffetVersion v={v} precedente={versions[i - 1]} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// --- 2. Courbes ----------------------------------------------------------------------

const L = 320
const H = 150
const M = { g: 36, d: 46, h: 18, b: 24 }

/** Petit graphique d'un champ : une ligne, une seule teinte, axes 0 à 100 %, v0 à v7. */
function Courbe({ cle, pts, titres }: { cle: Cle; pts: Point[]; titres: Record<string, string> }) {
  const idTitre = useId()
  const pas = (L - M.g - M.d) / Math.max(1, pts.length - 1)
  const x = (i: number) => M.g + i * pas
  const y = (v: number) => M.h + (1 - v) * (H - M.h - M.b)
  const i5 = pts.findIndex((p) => p.version === 'v5')
  const i6 = pts.findIndex((p) => p.version === 'v6')
  // Segments continus : un trou (version non mesurée) coupe la ligne, rien n'est interpolé.
  const segments: string[] = []
  let courant = ''
  pts.forEach((p, i) => {
    if (p.valeur === null) {
      if (courant) segments.push(courant)
      courant = ''
    } else courant += `${courant ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`
  })
  if (courant) segments.push(courant)
  const mesures = pts.map((p, i) => ({ p, i })).filter(({ p }) => p.valeur !== null)
  const extremes = [mesures[0], mesures[mesures.length - 1]]
  return (
    <figure aria-labelledby={idTitre} className="m-0 min-w-0">
      <figcaption id={idTitre} className="flex items-baseline justify-between gap-2">
        <span className={`text-petit text-text ${cle === 'entierement_justes' ? 'font-semibold' : 'font-medium'}`}>{LIBELLE[cle]}</span>
        <span className="font-mono text-[0.6875rem] text-text-2">{CODE[cle]}</span>
      </figcaption>
      <svg viewBox={`0 0 ${L} ${H}`} className="mt-1 block h-auto w-full overflow-visible" role="img" aria-label={`${LIBELLE[cle]}, part de tickets justes par version`}>
        {i5 >= 0 && i6 >= 0 && (
          <rect x={x(i5) - pas / 2} y={M.h} width={pas * 2} height={H - M.h - M.b} className="fill-surface-2" />
        )}
        {[0, 0.5, 1].map((g) => (
          <g key={g}>
            <line x1={M.g} x2={L - M.d} y1={y(g)} y2={y(g)} className="stroke-line" strokeWidth={1} />
            <text x={M.g - 6} y={y(g)} dy="0.32em" textAnchor="end" className="fill-text-2 text-[10px]">
              {g * 100} %
            </text>
          </g>
        ))}
        {pts.map((p, i) => (
          <text key={p.version} x={x(i)} y={H - 6} textAnchor="middle" className="fill-text-2 text-[10px]">
            {p.version}
          </text>
        ))}
        {segments.map((d) => (
          <path key={d} d={d} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {mesures.map(({ p, i }) => (
          <g key={p.version}>
            <circle
              cx={x(i)}
              cy={y(p.valeur!)}
              r={4}
              strokeWidth={2}
              className={p.reprise ? 'fill-surface stroke-accent' : 'fill-accent stroke-surface'}
            />
            <circle cx={x(i)} cy={y(p.valeur!)} r={12} fill="transparent">
              <title>
                {`${p.version} · ${titres[p.version]} : ${p.justes} justes sur ${p.n} (${pc(p.valeur!)})${p.reprise ? `, même mesure que ${p.reprise} (tri inchangé)` : ''}`}
              </title>
            </circle>
          </g>
        ))}
        {/* Étiquettes directes au départ et à l'arrivée seulement : la première sous le point si la
            ligne monte ensuite (au-dessus sinon), la dernière à droite du point, hors de la ligne. */}
        {extremes[0] && (() => {
          const { p, i } = extremes[0]
          const suivant = mesures[1]?.p.valeur ?? p.valeur!
          const dessous = suivant >= p.valeur!
          return (
            <text x={x(i) + 6} y={y(p.valeur!) + (dessous ? 15 : -8)} className="fill-text text-[11px] font-semibold">
              {pc(p.valeur!)}
            </text>
          )
        })()}
        {extremes[1] && mesures.length > 1 && (
          <text x={x(extremes[1].i) + 8} y={y(extremes[1].p.valeur!)} dy="0.32em" className="fill-text text-[11px] font-semibold">
            {pc(extremes[1].p.valeur!)}
          </text>
        )}
      </svg>
    </figure>
  )
}

function Courbes({ evo }: { evo: Evolution }) {
  const [jeu, setJeu] = useState<Jeu>('val60')
  const titres = Object.fromEntries(evo.versions.map((v) => [v.version, v.titre]))
  const n = evo.jeux[jeu].n
  return (
    <section aria-labelledby="titre-courbes" className="space-y-4">
      <Titre
        id="titre-courbes"
        detail="Part des tickets où le champ prédit égale la bonne réponse, pour chaque version. Chaque série est mesurée sur un seul jeu : on change de jeu, jamais on ne les mélange."
      >
        Précision par champ, version par version
      </Titre>
      <Figure
        titre={`Précision par version, sur ${jeu} (${n} tickets)`}
        sousTitre={evo.jeux[jeu].description}
        legende={
          <>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-accent" /> mesurée
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-full border-2 border-accent" /> même mesure que la
              version d’avant (tri inchangé)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block h-2.5 w-4 rounded-[3px] bg-surface-2" /> v5 et v6 : prompt de tri
              inchangé
            </span>
          </>
        }
        retenir={retenirCourbes(evo, jeu)}
      >
        <div role="radiogroup" aria-label="Jeu de données" className="mb-5 inline-flex rounded-full bg-surface-2 p-1">
          {JEUX.map((j) => (
            <button
              key={j}
              type="button"
              role="radio"
              aria-checked={j === jeu}
              onClick={() => setJeu(j)}
              className={`pressable montant h-8 rounded-full px-4 text-petit font-medium ${
                j === jeu ? 'bg-surface text-text shadow-[var(--ombre-1)]' : 'text-text-2 hover:text-text'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          {CLES.map((cle) => (
            <Courbe key={cle} cle={cle} pts={serie(evo.versions, jeu, cle)} titres={titres} />
          ))}
        </div>
        <p className="mt-4 text-[0.75rem] text-text-2">
          Axe horizontal : version du bot. Axe vertical : tickets justes (%). Survolez un point pour le détail.
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-petit font-medium text-accent">Voir les chiffres</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-petit">
              <thead>
                <tr className="border-b border-line text-left text-[0.75rem] text-text-2">
                  <th scope="col" className="py-2 pr-3 font-medium">Version</th>
                  {CLES.map((c) => (
                    <th key={c} scope="col" className="px-2 py-2 text-right font-medium">
                      {LIBELLE[c]}
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-2 text-right font-medium">Attaques obtenues</th>
                  <th scope="col" className="py-2 pl-2 font-medium">Run</th>
                </tr>
              </thead>
              <tbody>
                {evo.versions.map((v) => {
                  const m = v.mesures[jeu]
                  return (
                    <tr key={v.version} className="border-b border-line last:border-0">
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-text">
                        {v.version}
                      </th>
                      {CLES.map((c) => (
                        <td key={c} className="montant px-2 py-2 text-right text-text">
                          {m ? `${compte(m, c).justes}/${compte(m, c).n}` : 'non mesurée'}
                        </td>
                      ))}
                      <td className="montant px-2 py-2 text-right text-text">{m ? `${m.attaques.obtenues}/${m.attaques.n}` : ''}</td>
                      <td className="py-2 pl-2 font-mono text-[0.6875rem] whitespace-nowrap text-text-2">
                        {m ? `${m.run.split('/').pop()!.slice(0, 16)}${m.reprise_de ? ` (reprise ${m.reprise_de})` : ''}` : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </details>
      </Figure>
    </section>
  )
}

// --- 3. Note finale test100 ------------------------------------------------------------

function Final({ f }: { f: Evolution['final'] }) {
  const lignes = CLES.map((cle) => ({ cle, e: f.effet[cle] }))
  const x = (v: number) => `calc((100% - 64px) * ${v})`
  return (
    <section aria-labelledby="titre-final" className="space-y-4">
      <Titre
        id="titre-final"
        detail={`${f.description} Présenté à part : ce jeu n’a jamais servi à comparer les versions entre elles, seulement v0 et v7, une fois.`}
      >
        Note finale sur test100 : v0 contre v7
      </Titre>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Chiffre
          libelle="Entièrement justes, v7"
          valeur={pc(f.effet.entierement_justes.apres)}
          detail={`v0 : ${pc(f.effet.entierement_justes.avant)}`}
        />
        <Chiffre libelle="Catégorie, v7" valeur={pc(f.effet.label.apres)} detail={`v0 : ${pc(f.effet.label.avant)}`} />
        <Chiffre
          libelle="Attaques obtenues, v7"
          valeur={`${f.v7.attaques.obtenues} sur ${f.v7.attaques.n}`}
          detail={`v0 : ${f.v0.attaques.obtenues} sur ${f.v0.attaques.n}`}
        />
        {f.v7.sous_motif && (
          <Chiffre
            libelle="Sous-motif, v7"
            valeur={pc(f.v7.sous_motif.justes / f.v7.sous_motif.n)}
            detail="champ ajouté en v7, hors « entièrement justes »"
          />
        )}
      </div>
      <Figure
        titre={`Précision par champ sur test100 (${f.n} tickets)`}
        sousTitre="Deux barres par champ : v0 en haut, v7 en bas. p : test de McNemar exact apparié, v0 contre v7."
        legende={
          <>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px] bg-text-2 opacity-45" /> v0 (prompt minimal)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px] bg-accent" /> v7 (bot final, tag v7-final)
            </span>
          </>
        }
        retenir={retenirFinal(f)}
      >
        <div className="grid grid-cols-[minmax(0,148px)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3">
          {lignes.map(({ cle, e }) => (
            <div key={cle} className="contents">
              <span className={`text-petit ${cle === 'entierement_justes' ? 'font-semibold text-text' : 'text-text-2'}`}>{LIBELLE[cle]}</span>
              <div className="space-y-1">
                {(
                  [
                    ['v0', e.avant, 'bg-text-2 opacity-45'],
                    ['v7', e.apres, 'bg-accent'],
                  ] as const
                ).map(([v, val, fond]) => (
                  <div key={v} className="relative h-4" title={`${LIBELLE[cle]}, ${v} : ${pc(val)}`}>
                    {[0, 0.5, 1].map((g) => (
                      <span key={g} aria-hidden="true" className="absolute inset-y-0 w-px bg-line" style={{ left: x(g) }} />
                    ))}
                    <span aria-hidden="true" className={`absolute top-0.5 h-3 rounded-r-[4px] ${fond}`} style={{ left: 0, width: x(val) }} />
                    <span className="montant absolute top-0 flex h-4 items-center pl-1.5 text-[0.75rem] font-medium text-text" style={{ left: x(val) }}>
                      {v} {pc(val)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="montant text-right text-[0.75rem] text-text-2">
                {pValeur(e.p)}
                <span className="block">{points(e.apres - e.avant)}</span>
              </span>
            </div>
          ))}
          <span />
          <div aria-hidden="true" className="relative h-4">
            {[0, 0.5, 1].map((g) => (
              <span key={g} className="montant absolute -translate-x-1/2 text-[0.75rem] leading-4 text-text-2" style={{ left: x(g) }}>
                {g * 100} %
              </span>
            ))}
          </div>
          <span />
          <span />
          <p className="text-[0.75rem] text-text-2">Tickets justes (%)</p>
        </div>
      </Figure>
    </section>
  )
}

// --- 4. Comparateur ----------------------------------------------------------------------

function LigneDuDiff({ l }: { l: LigneDiff }) {
  const fond =
    l.op === 'ajout' ? 'bg-[rgb(var(--accent-rgb)/0.08)]' : l.op === 'suppression' ? 'bg-[rgb(var(--danger-rgb)/0.07)]' : ''
  const signe = l.op === 'ajout' ? '+' : l.op === 'suppression' ? '−' : ' '
  return (
    <div className={`grid grid-cols-[32px_32px_16px_minmax(0,1fr)] ${fond}`}>
      <span className="montant pr-2 text-right text-text-2 select-none">{l.a ?? ''}</span>
      <span className="montant pr-2 text-right text-text-2 select-none">{l.b ?? ''}</span>
      <span aria-hidden="true" className={`select-none ${l.op === 'ajout' ? 'text-accent' : 'text-danger'}`}>
        {signe}
      </span>
      <span className="break-words whitespace-pre-wrap text-text">
        {l.morceaux.map((m, k) =>
          m.op === 'ajout' ? (
            <ins key={k} className="rounded-[3px] bg-[rgb(var(--accent-rgb)/0.28)] no-underline">
              {m.texte}
            </ins>
          ) : m.op === 'suppression' ? (
            <del key={k} className="rounded-[3px] bg-[rgb(var(--danger-rgb)/0.24)]">
              {m.texte}
            </del>
          ) : (
            <span key={k}>{m.texte}</span>
          ),
        )}
        {!l.morceaux.some((m) => m.texte) && ' '}
      </span>
    </div>
  )
}

function Choix({ libelle, valeur, versions, onChange }: { libelle: string; valeur: string; versions: Version[]; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[0.75rem] font-medium text-text-2">
        {libelle}
      </label>
      <select
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-[10px] border border-line bg-surface px-3 text-petit text-text"
      >
        {versions.map((v) => (
          <option key={v.version} value={v.version}>
            {v.version} · {v.titre}
            {v.change_le_prompt_de_tri ? '' : ' (prompt v4)'}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Comparateur({ versions, initial = ['v3', 'v4'] }: { versions: Version[]; initial?: [string, string] }) {
  const [a, setA] = useState(initial[0])
  const [b, setB] = useState(initial[1])
  const [tout, setTout] = useState(false)
  const [ouverts, setOuverts] = useState<Set<number>>(() => new Set())
  const va = versions.find((v) => v.version === a) ?? versions[0]!
  const vb = versions.find((v) => v.version === b) ?? versions[versions.length - 1]!
  const lignes = useMemo(() => diffLignes(va.prompt_texte, vb.prompt_texte), [va, vb])
  const { ajouts, suppressions } = bilan(lignes)
  const blocs = replier(lignes)
  const identiques = ajouts === 0 && suppressions === 0
  const changer = (f: (v: string) => void) => (v: string) => {
    f(v)
    setOuverts(new Set())
  }
  return (
    <section aria-labelledby="titre-comparateur" className="space-y-4">
      <Titre
        id="titre-comparateur"
        detail="Choisissez deux versions : le texte des deux prompts de tri, ligne par ligne. Ajouts surlignés en bleu, suppressions en rouge, et dans une ligne modifiée seuls les mots qui changent."
      >
        Comparer deux prompts
      </Titre>
      <div className="bloc space-y-4 p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3 md:max-w-[640px]">
          <Choix libelle="Version A (avant)" valeur={va.version} versions={versions} onChange={changer(setA)} />
          <button
            type="button"
            onClick={() => {
              setA(vb.version)
              setB(va.version)
              setOuverts(new Set())
            }}
            aria-label="Inverser A et B"
            title="Inverser A et B"
            className="pressable survol grid size-10 place-items-center rounded-full text-text-2"
          >
            <ArrowsLeftRightIcon size={18} aria-hidden="true" />
          </button>
          <Choix libelle="Version B (après)" valeur={vb.version} versions={versions} onChange={changer(setB)} />
        </div>
        <div className="space-y-1">
          <p className="text-[0.75rem] font-medium text-text-2">La même comparaison dans Git</p>
          <Commande commande={commandeDiff(va, vb)} />
        </div>
        {identiques ? (
          <p className="rounded-[12px] bg-surface-2 px-4 py-3 text-petit text-text">
            Aucune différence : {va.version} et {vb.version} ont le même prompt de tri ({vb.prompt}).
            {[va, vb].some((v) => !v.change_le_prompt_de_tri) && ' v5 et v6 ne changent pas le prompt de tri : elles ajoutent la garde d’entrée et le brouillon.'}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 text-petit text-text [font-variant-numeric:tabular-nums]">
                <span className="font-medium text-accent">+{ajouts} ligne{ajouts > 1 ? 's' : ''}</span>
                {' · '}
                <span className="font-medium text-danger">−{suppressions} ligne{suppressions > 1 ? 's' : ''}</span>
                <span className="text-text-2">
                  {' '}
                  · <span className="break-all">{va.prompt} → {vb.prompt}</span>
                </span>
              </p>
              <button
                type="button"
                onClick={() => setTout((t) => !t)}
                aria-pressed={tout}
                className="pressable h-8 rounded-full border border-line bg-surface px-4 text-petit font-medium text-text hover:bg-surface-2"
              >
                {tout ? 'Changements seulement' : 'Tout le prompt'}
              </button>
            </div>
            <div className="overflow-hidden rounded-[12px] border border-line font-mono text-[0.75rem] leading-5">
              <div className="grid grid-cols-[32px_32px_16px_minmax(0,1fr)] border-b border-line bg-surface-2 text-[0.6875rem] text-text-2">
                <span className="pr-2 text-right">{va.version}</span>
                <span className="pr-2 text-right">{vb.version}</span>
                <span />
                <span>ligne</span>
              </div>
              {blocs.map((bloc, k) =>
                bloc.type === 'lignes' || tout || ouverts.has(k) ? (
                  bloc.lignes.map((l, j) => <LigneDuDiff key={`${k}-${j}`} l={l} />)
                ) : (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setOuverts((o) => new Set(o).add(k))}
                    className="block w-full bg-surface-2 px-3 py-1 text-left font-sans text-[0.75rem] text-text-2 hover:text-text"
                  >
                    {bloc.lignes.length} ligne{bloc.lignes.length > 1 ? 's' : ''} identique{bloc.lignes.length > 1 ? 's' : ''} : afficher
                  </button>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// --- 5. Git -------------------------------------------------------------------------------

function DansGit({ versions }: { versions: Version[] }) {
  return (
    <section aria-labelledby="titre-git" className="space-y-4">
      <Titre
        id="titre-git"
        detail="Chaque version du prompt est un fichier de prompts/, ajouté par un commit et fusionné par une pull request. Git garde tout : ces commandes retrouvent chaque version, et ce qui a changé, depuis la racine du dépôt."
      >
        Retrouver chaque version dans Git
      </Titre>
      <div className="bloc space-y-3 p-5">
        <p className="text-[0.75rem] font-medium text-text-2">Toute l’histoire des prompts, et les tags</p>
        <Commande commande="git log --oneline -- prompts/" />
        <Commande commande="git tag -n" />
      </div>
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {versions.map((v) => (
          <li key={v.version} className="bloc min-w-0 space-y-2 p-5">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-corps font-semibold text-text">
                {v.version} · {v.titre}
              </span>
              <span className="montant text-[0.75rem] text-text-2">
                {v.commit_court}
                {v.pr ? ` · PR #${v.pr}` : ''}
                {v.tags.length ? ` · tag ${v.tags.map((t) => t.nom).join(', ')}` : ''}
              </span>
            </p>
            {v.git.map((c) => (
              <div key={c.commande} className="space-y-1">
                <p className="text-[0.75rem] text-text-2">{c.but}</p>
                <Commande commande={c.commande} />
              </div>
            ))}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Le contenu de l'onglet, sur des données déjà chargées (rendu testé sans réseau). */
export function PromptsContenu({ evo }: { evo: Evolution }) {
  return (
    <>
      <section aria-labelledby="titre-prompts" className="space-y-3">
        <Titre id="titre-prompts">Huit versions du prompt de tri</Titre>
        <p className="max-w-[72ch] text-corps text-text">
          Chaque version du bot a été mesurée avant d’être fusionnée : un changement à la fois, sur les mêmes tickets. Modèle :{' '}
          {evo.modele}.
        </p>
        <ul className="max-w-[72ch] list-disc space-y-1 pl-5 text-petit text-text-2">
          <li>
            <span className="font-medium text-text">v5 et v6 ne changent pas le prompt de tri.</span> La v5 ajoute une garde d’entrée
            en code, avant le LLM ; la v6 ajoute le brouillon de réponse. Le prompt de tri reste celui de la v4 jusqu’à la v7.
          </li>
          <li>
            Chaque chiffre dit sur quel jeu il a été mesuré. Une courbe ne mélange jamais deux jeux ; test100 est présenté à part.
          </li>
          <li>« Tickets entièrement justes » : {evo.entierement_justes}.</li>
        </ul>
      </section>
      <Frise versions={evo.versions} />
      <Courbes evo={evo} />
      <Final f={evo.final} />
      <Comparateur versions={evo.versions} />
      <DansGit versions={evo.versions} />
    </>
  )
}

export function Prompts() {
  const [evo, recharger] = useRessource(chargerEvolution)
  if (evo.etat === 'chargement')
    return (
      <div aria-busy="true" aria-label="Chargement de l’évolution des prompts" className="bloc space-y-3 p-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Os key={i} className="h-10 w-full rounded-[8px]" />
        ))}
      </div>
    )
  if (evo.etat === 'erreur') return <ErreurBloc onReessayer={recharger} />
  return <PromptsContenu evo={evo.donnees} />
}
