import { DownloadSimpleIcon } from '@phosphor-icons/react'
import { Barres, Figure } from './graphiques'
import { CHAMP, COLONNES } from './libelles'
import { pctRond } from './retenir'
import type { Validation } from './types'

const s = (n: number) => (n > 1 ? 's' : '')

/** Phrase « à retenir » des décisions, calculée sur les mêmes chiffres. */
export function retenirDecisions(v: Validation): string {
  if (!v.decides) return `Aucune décision encore : ${v.en_attente} brouillon${s(v.en_attente)} en attente.`
  const tel = v.valides_sans_modification
  return (
    `${tel} brouillon${s(tel)} sur ${v.decides} (${pctRond(tel, v.decides)}) envoyé${s(tel)} tel${s(tel)} quel${s(tel)} ; ` +
    `${v.valides_modifies} retouché${s(v.valides_modifies)}, ${v.rejetes} rejeté${s(v.rejetes)}.`
  )
}

export function retenirCorrections(v: Validation): string {
  const total = COLONNES.reduce((a, c) => a + v.corrections[c], 0)
  if (!total) return v.decides ? 'Le conseiller n’a corrigé aucun champ du tri.' : 'Pas encore de décision.'
  const pire = COLONNES.reduce((a, c) => (v.corrections[c] > v.corrections[a] ? c : a), COLONNES[0]!)
  return `${total} correction${s(total)} au total ; le champ le plus corrigé est ${CHAMP[pire].toLowerCase()} (${v.corrections[pire]}).`
}

/** Décisions du conseiller et corrections par champ, avec l'export CSV des corrections. */
export function ValidationChiffres({ v, export: url }: { v: Validation; export: string }) {
  const max = Math.max(1, v.decides + v.en_attente)
  const decisions = [
    { cle: 'tel', libelle: 'Envoyés tels quels', n: v.valides_sans_modification },
    { cle: 'modifies', libelle: 'Modifiés puis envoyés', n: v.valides_modifies },
    { cle: 'rejetes', libelle: 'Rejetés', n: v.rejetes },
    { cle: 'attente', libelle: 'En attente', n: v.en_attente },
  ]
  const maxC = Math.max(1, ...COLONNES.map((c) => v.corrections[c]))
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      <Figure
        titre="Décisions sur les brouillons"
        sousTitre={`Sur ${v.brouillons} brouillon${s(v.brouillons)}. Pourcentages sur les ${v.decides} décidés.`}
        retenir={retenirDecisions(v)}
      >
        <Barres
          max={max}
          largeurLibelle={152}
          axe="Nombre de brouillons"
          barres={decisions.map((d) => ({
            cle: d.cle,
            libelle: d.libelle,
            valeur: d.n,
            texte: d.cle === 'attente' || !v.decides ? `${d.n}` : `${d.n} · ${pctRond(d.n, v.decides)}`,
            infobulle: `${d.libelle} : ${d.n}`,
          }))}
        />
      </Figure>
      <Figure
        titre="Corrections du tri par le conseiller"
        sousTitre="Nombre de tickets où le conseiller a changé la valeur du bot, par champ."
        retenir={retenirCorrections(v)}
        legende={
          <a href={url} download className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            <DownloadSimpleIcon size={14} aria-hidden="true" />
            Exporter les corrections (CSV)
          </a>
        }
      >
        <Barres
          max={maxC}
          axe="Corrections"
          barres={COLONNES.map((c) => ({
            cle: c,
            libelle: CHAMP[c],
            valeur: v.corrections[c],
            texte: `${v.corrections[c]}`,
            infobulle: `${CHAMP[c]} : ${v.corrections[c]} correction${s(v.corrections[c])}`,
          }))}
        />
      </Figure>
    </div>
  )
}
