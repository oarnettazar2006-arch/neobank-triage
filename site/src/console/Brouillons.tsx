import {
  CheckCircleIcon,
  FlowArrowIcon,
  ShieldWarningIcon,
  WarningCircleIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useRessource } from '../api'
import { ErreurBloc, Os } from '../composants/Etats'
import { deciderBrouillon, ErreurApi, listerBrouillons, urlCorrections, verifierBrouillon } from './api'
import { CHAMP, COLONNES, libelle, VALEURS } from './libelles'
import { Segments } from './Pipeline'
import { surligner } from './trace'
import { ValidationChiffres } from './Validation'
import type { Brouillon, Colonne, FileBrouillons, Retrait } from './types'

const s = (n: number) => (n > 1 ? 's' : '')
const sousMotif = (v: string | null) => (v ? v.replace(/_/g, ' ') : '')

/** Le ticket choisi, dans l'adresse (?cle=LOT-XXXXXX-3 ou ?cle=VLT-XXXXXX) : un rechargement le garde. */
function cleDeLAdresse(): string | null {
  return new URLSearchParams(window.location.search).get('cle')
}

function ecrireCle(cle: string | null) {
  const url = new URL(window.location.href)
  if (cle) url.searchParams.set('cle', cle)
  else url.searchParams.delete('cle')
  window.history.replaceState(null, '', url)
}

/** Lien vers la trace du ticket dans la vue Pipeline. */
export function lienTrace(b: Brouillon): string {
  const t = b.trace
  return 'ref' in t
    ? `/console?ref=${encodeURIComponent(t.ref)}`
    : `/console?lot=${encodeURIComponent(t.lot)}&ticket=${t.n}`
}

export function Badge({ ton, children }: { ton: 'danger' | 'accent' | 'neutre'; children: ReactNode }) {
  const fond =
    ton === 'danger'
      ? 'bg-[rgb(var(--danger-rgb)/0.12)]'
      : ton === 'accent'
        ? 'bg-[rgb(var(--accent-rgb)/0.12)]'
        : 'bg-surface-2'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.75rem] leading-4 font-medium whitespace-nowrap text-text ${fond}`}>
      {children}
    </span>
  )
}

/** Échéance : date courte et jours ouvrés restants ; proche ou dépassée en --danger, avec un mot. */
function Echeance({ b }: { b: Brouillon }) {
  const e = b.echeance
  if (!e) return <span className="text-text-2">aucune</span>
  const urgent = e.delai === 'proche' || e.delai === 'depasse'
  const reste =
    e.delai === 'depasse'
      ? 'dépassée'
      : e.jours_ouvres_restants === 0
        ? 'aujourd’hui'
        : `${e.jours_ouvres_restants} j ouvré${s(e.jours_ouvres_restants ?? 0)}`
  return (
    <span className="flex flex-col items-start" title={e.texte}>
      <span className="montant text-text">{e.court}</span>
      <span className={`flex items-center gap-1 text-[0.75rem] leading-4 whitespace-nowrap ${urgent ? 'text-danger' : 'text-text-2'}`}>
        {urgent && <WarningCircleIcon size={12} weight="fill" aria-hidden="true" />}
        {reste}
      </span>
    </span>
  )
}

function Origine({ b }: { b: Brouillon }) {
  return 'ref' in b.origine ? <>Chat · reçu le {b.recu_le_texte}</> : <>{b.origine.nom} · ticket {b.origine.n}</>
}

// --- La file ---------------------------------------------------------------------------

function File({ file, choisi, onChoisir }: { file: Brouillon[]; choisi: string | null; onChoisir: (cle: string) => void }) {
  return (
    <section aria-labelledby="titre-file" className="bloc min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-3">
        <h2 id="titre-file" className="text-section font-semibold tracking-[-0.01em] text-text">
          En attente <span className="montant text-text-2">{file.length}</span>
        </h2>
        <p className="text-petit text-text-2">Réclamations d’abord, puis échéance la plus proche, puis gravité.</p>
      </div>
      {!file.length ? (
        <p className="px-5 pt-4 pb-10 text-center text-petit text-text-2">
          Aucun brouillon en attente. Écrivez un ticket, lancez un lot avec brouillons, ou envoyez un message depuis le
          chat de l’espace client.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] border-collapse text-petit">
            <thead>
              <tr className="border-y border-line text-left text-[0.75rem] text-text-2">
                <th scope="col" className="h-8 pl-5 font-medium">
                  Ticket
                </th>
                {COLONNES.map((c) => (
                  <th key={c} scope="col" className="w-[84px] font-medium">
                    {CHAMP[c]}
                  </th>
                ))}
                <th scope="col" className="w-[104px] font-medium">
                  Sous-motif
                </th>
                <th scope="col" className="w-[88px] pr-5 font-medium">
                  Échéance
                </th>
              </tr>
            </thead>
            <tbody>
              {file.map((b) => {
                const actif = b.cle === choisi
                return (
                  <tr
                    key={b.cle}
                    className={`border-b border-line align-top ${
                      actif ? 'bg-[rgb(var(--accent-rgb)/0.08)]' : b.suspect ? 'bg-[rgb(var(--danger-rgb)/0.08)]' : ''
                    }`}
                  >
                    <td className="py-1.5 pr-3 pl-3">
                      <button
                        type="button"
                        onClick={() => onChoisir(b.cle)}
                        aria-current={actif ? 'true' : undefined}
                        className="flex w-full min-w-0 flex-col items-start gap-0.5 rounded-[6px] px-2 py-1 text-left hover:bg-surface-2"
                      >
                        <span className="flex max-w-full items-center gap-1.5">
                          {b.suspect && <ShieldWarningIcon size={16} className="shrink-0 text-danger" aria-hidden="true" />}
                          <span className="montant truncate font-medium text-text">{b.id}</span>
                          {b.reclamation && <Badge ton="accent">Réclamation</Badge>}
                          {b.suspect && <Badge ton="danger">Suspect</Badge>}
                          {b.etat === 'a_rediger' && <Badge ton="neutre">Réponse à rédiger</Badge>}
                        </span>
                        <span className="line-clamp-1 text-text">{b.texte}</span>
                        <span className="truncate text-[0.75rem] text-text-2">
                          <Origine b={b} />
                        </span>
                      </button>
                    </td>
                    <td className="py-2.5 pr-3 text-text">{libelle('categorie', b.categorie)}</td>
                    <td className="py-2.5 pr-3 text-text">{libelle('produit', b.produit)}</td>
                    <td className="py-2.5 pr-3">
                      {b.severite === 'high' ? (
                        <Badge ton="danger">{libelle('severite', b.severite)}</Badge>
                      ) : (
                        <span className="text-text">{libelle('severite', b.severite)}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-text-2">{sousMotif(b.sous_motif)}</td>
                    <td className="py-2.5 pr-5">
                      <Echeance b={b} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// --- Le détail ---------------------------------------------------------------------------

const RAISON: Record<string, string> = {
  accord: 'tri et contrôleur d’accord, cohérents avec le label',
  désaccord: 'tri et contrôleur en désaccord sur le sous-motif',
  'incohérent avec label': 'sous-motif incohérent avec le label prédit',
  'incohérent avec unauthorized_payment': 'sous-motif incohérent avec « paiement non autorisé »',
  anglais: 'ticket en anglais : les fiches n’existent qu’en français',
}

function Rubrique({ titre, children, droite }: { titre: string; children: ReactNode; droite?: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[0.75rem] font-medium text-text-2">{titre}</h3>
        {droite}
      </div>
      {children}
    </div>
  )
}

/** Alertes de la garde de sortie sur le texte du conseiller : un avertissement, jamais un blocage. */
export function AlertesGarde({ alertes }: { alertes: Retrait[] }) {
  if (!alertes.length) return null
  return (
    <div role="status" className="rounded-[10px] bg-[rgb(var(--danger-rgb)/0.08)] px-3 py-2.5 text-petit text-text">
      <p className="flex items-start gap-2 font-medium">
        <WarningIcon size={16} className="mt-px shrink-0 text-danger" aria-hidden="true" />
        La garde de sortie signale {alertes.length} problème{s(alertes.length)} dans votre texte. Vous pouvez quand même
        l’envoyer.
      </p>
      <ul className="mt-1.5 space-y-0.5 pl-6">
        {alertes.map((a, i) => (
          <li key={i}>
            <span className="text-danger">{a.rule}</span> : « {a.text} »
          </li>
        ))}
      </ul>
    </div>
  )
}

type Envoi = { etat: 'repos' } | { etat: 'envoi' } | { etat: 'erreur'; message: string }

export function Detail({
  b,
  motifs,
  onDecide,
}: {
  b: Brouillon
  motifs: string[]
  onDecide: (message: string) => void
}) {
  const aRediger = b.etat === 'a_rediger'
  // Brouillon rejeté : le conseiller rédige la réponse ; le brouillon du bot reste consultable.
  const [texte, setTexte] = useState(aRediger ? '' : b.brouillon)
  const [valeurs, setValeurs] = useState<Record<Colonne, string>>({
    categorie: b.categorie,
    produit: b.produit,
    severite: b.severite,
  })
  const [relu, setRelu] = useState(false)
  const [rejet, setRejet] = useState(false)
  const [motif, setMotif] = useState('')
  const [precision, setPrecision] = useState('')
  const [verif, setVerif] = useState<{ texte: string; alertes: Retrait[] } | null>(null)
  const [envoi, setEnvoi] = useState<Envoi>({ etat: 'repos' })
  const modifie = texte.replace(/\s+/g, ' ').trim() !== b.brouillon.replace(/\s+/g, ' ').trim()

  // Texte modifié : la garde de sortie repasse sur le nouveau texte, 400 ms après la dernière frappe.
  useEffect(() => {
    if (!modifie || !texte.trim()) return
    const controle = new AbortController()
    const minuterie = setTimeout(() => {
      verifierBrouillon(b.cle, texte, controle.signal).then(
        (r) => setVerif({ texte, alertes: r.alertes }),
        () => {},
      )
    }, 400)
    return () => {
      clearTimeout(minuterie)
      controle.abort()
    }
  }, [b.cle, texte, modifie])
  const alertes = modifie && verif?.texte === texte ? verif.alertes : []

  // Les trois valeurs retenues partent toujours : égale à celle du bot, une valeur annule une correction antérieure.
  const corrections = valeurs
  const motifFinal = motif === 'Autre' ? precision.trim() && `Autre : ${precision.trim()}` : motif

  async function decider(decision: 'valide' | 'rejete') {
    setEnvoi({ etat: 'envoi' })
    try {
      const d = await deciderBrouillon(b.cle, {
        decision,
        texte,
        motif: decision === 'rejete' ? motifFinal : undefined,
        corrections,
        relu,
      })
      const n = d.corrections.length
      onDecide(
        (decision === 'valide' ? `${b.id} : réponse envoyée` : `${b.id} : brouillon rejeté, réponse à rédiger`) +
          (d.modifie && decision === 'valide' && !aRediger ? ', texte modifié' : '') +
          (n ? `, ${n} correction${s(n)} enregistrée${s(n)}` : '') +
          '.',
      )
    } catch (e) {
      setEnvoi({ etat: 'erreur', message: e instanceof ErreurApi ? e.message : 'Le service ne répond pas.' })
    }
  }

  const bloqueSuspect = b.suspect && !relu
  const occupe = envoi.etat === 'envoi'

  return (
    <section aria-labelledby="titre-detail" className="min-w-0 space-y-5 px-5 pt-5">
      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="titre-detail" className="montant text-section font-semibold tracking-[-0.01em] text-text">
            {b.id}
          </h2>
          {b.reclamation && <Badge ton="accent">Réclamation</Badge>}
          {b.suspect && (
            <Badge ton="danger">
              <ShieldWarningIcon size={12} aria-hidden="true" />
              Suspect
            </Badge>
          )}
          {aRediger && <Badge ton="neutre">Réponse à rédiger</Badge>}
        </div>
        <p className="text-petit text-text-2">
          <Origine b={b} />
          {b.echeance && (
            <>
              {' '}
              · échéance le {b.echeance.texte}
              {b.echeance.jours_ouvres_restants != null && b.echeance.delai !== 'depasse'
                ? ` (${b.echeance.jours_ouvres_restants} j ouvré${s(b.echeance.jours_ouvres_restants)})`
                : b.echeance.delai === 'depasse'
                  ? ' (dépassée)'
                  : ''}
            </>
          )}
        </p>
        {b.trace.disponible ? (
          <a href={lienTrace(b)} className="inline-flex items-center gap-1.5 text-petit font-medium text-accent hover:underline">
            <FlowArrowIcon size={14} aria-hidden="true" />
            Voir sa trace dans Pipeline
          </a>
        ) : (
          <p className="text-petit text-text-2">Pas de trace enregistrée pour ce ticket.</p>
        )}
      </header>

      <Rubrique titre={b.passages_retires.length ? 'Ticket du client · passages retirés par la garde soulignés' : 'Ticket du client'}>
        <p className="max-h-[200px] overflow-y-auto rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-corps whitespace-pre-wrap text-text">
          <Segments segments={surligner(b.texte, b.passages_retires.map((p) => p.text))} ton="danger" />
        </p>
      </Rubrique>

      <Rubrique titre="Tri du bot · corrigez si besoin">
        <div className="grid grid-cols-3 gap-2">
          {COLONNES.map((c) => {
            const corrige = valeurs[c] !== b.bot[c]
            return (
              <label key={c} className="min-w-0 space-y-1">
                <span className="block text-[0.75rem] text-text-2">
                  {CHAMP[c]}
                  {corrige && <span className="font-medium text-accent"> · corrigé</span>}
                </span>
                <select
                  value={valeurs[c]}
                  onChange={(e) => setValeurs((v) => ({ ...v, [c]: e.target.value }))}
                  className={`h-9 w-full rounded-[10px] border bg-surface px-2 text-petit text-text focus:border-accent focus:outline-none ${
                    corrige ? 'border-accent' : 'border-line'
                  }`}
                >
                  {Object.keys(VALEURS[c]).map((code) => (
                    <option key={code} value={code}>
                      {libelle(c, code)}
                      {code === b.bot[c] ? ' (bot)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )
          })}
        </div>
        <p className="text-[0.75rem] text-text-2">
          Sous-motif : <span className="text-text">{sousMotif(b.sous_motif) || 'aucun'}</span> · réclamation :{' '}
          <span className="text-text">{b.reclamation ? 'oui' : 'non'}</span>
        </p>
      </Rubrique>

      <Rubrique titre="Fiche de réponse">
        <p className="text-petit text-text">
          {b.fiche ? (
            <>
              Fiche <code className="font-mono text-[0.75rem]">{b.fiche}</code> utilisée
              <span className="text-text-2"> · {RAISON.accord}.</span>
            </>
          ) : (
            <>
              Pas de fiche : brouillon générique
              {b.fiche_raison && <span className="text-text-2"> · {RAISON[b.fiche_raison] ?? b.fiche_raison}.</span>}
            </>
          )}
        </p>
      </Rubrique>

      {aRediger && b.rejet && (
        <div className="space-y-2 rounded-[10px] bg-surface-2 px-3 py-2.5 text-petit text-text">
          <p>
            <span className="font-medium">Brouillon du bot rejeté</span> le {b.rejet.decide_le_texte} : {b.rejet.motif}.
            La demande du client reste ouverte : rédigez la réponse ci-dessous.
          </p>
          <details>
            <summary className="cursor-pointer text-[0.75rem] font-medium text-accent">Voir le brouillon rejeté</summary>
            <p className="mt-2 text-petit whitespace-pre-wrap text-text-2">{b.brouillon}</p>
          </details>
        </div>
      )}

      <Rubrique
        titre={aRediger ? 'Réponse du conseiller' : 'Brouillon'}
        droite={
          aRediger ? undefined : modifie ? (
            <button type="button" onClick={() => setTexte(b.brouillon)} className="text-[0.75rem] font-medium text-accent hover:underline">
              Revenir au brouillon du bot
            </button>
          ) : (
            <span className="text-[0.75rem] text-text-2">tel que rédigé par le bot</span>
          )
        }
      >
        {b.brouillon_bloque && (
          <p className="text-[0.75rem] text-text-2">
            La garde de sortie avait bloqué le brouillon du modèle : ce texte est le modèle fixe écrit en code.
          </p>
        )}
        <textarea
          aria-label={aRediger ? 'Réponse à rédiger' : 'Brouillon de réponse'}
          placeholder={aRediger ? 'Rédigez la réponse au client…' : undefined}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-[12px] border border-line bg-surface px-3 py-2 text-corps text-text focus:border-accent focus:outline-none"
        />
        <AlertesGarde alertes={alertes} />
      </Rubrique>

      {b.suspect && (
        <label className="flex items-start gap-2 rounded-[10px] bg-[rgb(var(--danger-rgb)/0.06)] px-3 py-2.5 text-petit text-text">
          <input type="checkbox" checked={relu} onChange={(e) => setRelu(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
          <span>
            J’ai relu le ticket signalé.
            <span className="block text-[0.75rem] text-text-2">Obligatoire pour valider un ticket suspect.</span>
          </span>
        </label>
      )}

      {envoi.etat === 'erreur' && (
        <p role="alert" className="flex items-start gap-2 text-petit text-text">
          <WarningCircleIcon size={16} className="mt-px shrink-0 text-danger" aria-hidden="true" />
          Décision refusée : {envoi.message}.
        </p>
      )}

      {/* Barre d'actions collée en bas du panneau : toujours visible, même sur un long brouillon. */}
      <div className="sticky bottom-0 -mx-5 space-y-3 border-t border-line bg-surface px-5 py-4">
        {alertes.length > 0 && !rejet && (
          <p className="flex items-start gap-2 text-[0.75rem] text-text">
            <WarningIcon size={14} className="mt-px shrink-0 text-danger" aria-hidden="true" />
            Garde de sortie : {alertes.map((a) => a.rule).join(', ')}. L’envoi reste possible.
          </p>
        )}
        {!rejet ? (
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              disabled={occupe || bloqueSuspect || !texte.trim()}
              onClick={() => void decider('valide')}
              className="pressable h-8 rounded-full bg-accent px-4 text-petit font-medium text-on-accent disabled:opacity-50"
            >
              {occupe ? 'Envoi…' : aRediger ? 'Envoyer la réponse' : 'Valider et envoyer'}
            </button>
            {!aRediger && (
              <button
                type="button"
                disabled={occupe}
                onClick={() => setRejet(true)}
                className="pressable h-8 rounded-full border border-danger px-4 text-petit font-medium text-danger disabled:opacity-50"
              >
                Rejeter
              </button>
            )}
          </div>
        ) : (
          <fieldset className="space-y-3 rounded-[12px] border border-danger p-3">
            <legend className="px-1 text-petit font-medium text-danger">Rejeter ce brouillon</legend>
            <label className="block space-y-1">
              <span className="block text-[0.75rem] text-text-2">Motif (obligatoire)</span>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="h-9 w-full rounded-[10px] border border-line bg-surface px-2 text-petit text-text focus:border-accent focus:outline-none"
              >
                <option value="">Choisir un motif…</option>
                {motifs.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            {motif === 'Autre' && (
              <label className="block space-y-1">
                <span className="block text-[0.75rem] text-text-2">Précisez</span>
                <input
                  value={precision}
                  maxLength={400}
                  onChange={(e) => setPrecision(e.target.value)}
                  className="h-9 w-full rounded-[10px] border border-line bg-surface px-2 text-petit text-text focus:border-accent focus:outline-none"
                />
              </label>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={occupe || !motifFinal}
                onClick={() => void decider('rejete')}
                className="pressable h-8 rounded-full bg-danger px-4 text-petit font-medium text-on-accent disabled:opacity-50"
              >
                {occupe ? 'Envoi…' : 'Confirmer le rejet'}
              </button>
              <button type="button" onClick={() => setRejet(false)} className="h-8 px-2 text-petit font-medium text-text-2 hover:text-text">
                Annuler
              </button>
            </div>
          </fieldset>
        )}
      </div>
    </section>
  )
}

// --- La vue ------------------------------------------------------------------------------

/** Contenu de la vue, sans chargement (tests et rendu statique). */
export function VueBrouillons({
  donnees,
  choisi,
  onChoisir,
  onDecide,
  message,
}: {
  donnees: FileBrouillons
  choisi: string | null
  onChoisir: (cle: string) => void
  onDecide: (message: string) => void
  message: string | null
}) {
  const b = donnees.file.find((x) => x.cle === choisi) ?? null
  return (
    <>
      <ValidationChiffres v={donnees.validation} export={urlCorrections()} />
      {message && (
        <p role="status" className="flex items-center gap-2 text-petit text-text">
          <CheckCircleIcon size={16} weight="fill" className="text-accent" aria-hidden="true" />
          {message}
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <File file={donnees.file} choisi={choisi} onChoisir={onChoisir} />
        {b ? (
          // En desktop large, le détail colle sous l'en-tête et défile en lui-même : ses boutons restent à portée.
          <div className="bloc xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
            <Detail key={b.cle} b={b} motifs={donnees.motifs} onDecide={onDecide} />
          </div>
        ) : (
          donnees.file.length > 0 && (
            <p className="bloc p-5 text-center text-petit text-text-2">Choisissez un ticket dans la file pour relire son brouillon.</p>
          )
        )}
      </div>
    </>
  )
}

/** Onglet Brouillons : la file des brouillons à valider, lots et chat confondus. */
export function Brouillons() {
  const [file, recharger] = useRessource(listerBrouillons)
  const [choisi, setChoisi] = useState<string | null>(cleDeLAdresse)
  const [message, setMessage] = useState<string | null>(null)
  const choisir = (cle: string | null) => {
    setChoisi(cle)
    ecrireCle(cle)
  }
  const liste = file.etat === 'pret' ? file.donnees.file : null
  // Rien de choisi (ou ticket déjà traité) : le premier de la file, le plus urgent.
  const actif = liste ? (liste.some((x) => x.cle === choisi) ? choisi : (liste[0]?.cle ?? null)) : choisi
  return (
    <section aria-label="Brouillons à valider" className="space-y-4">
      {file.etat === 'chargement' && (
        <div aria-busy="true" aria-label="Chargement des brouillons" className="bloc space-y-3 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Os key={i} className="h-10 w-full rounded-[8px]" />
          ))}
        </div>
      )}
      {file.etat === 'erreur' && <ErreurBloc onReessayer={recharger} />}
      {file.etat === 'pret' && (
        <VueBrouillons
          donnees={file.donnees}
          choisi={actif}
          onChoisir={(cle) => {
            setMessage(null)
            choisir(cle)
          }}
          onDecide={(m) => {
            setMessage(m)
            // Le ticket suivant de la file prend sa place.
            const i = liste?.findIndex((x) => x.cle === actif) ?? -1
            choisir(liste?.[i + 1]?.cle ?? null)
            recharger()
          }}
          message={message}
        />
      )}
    </section>
  )
}
