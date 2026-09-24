import {
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  ShieldWarningIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Ressource } from '../api'
import { ErreurBloc, Os } from '../composants/Etats'
import { chargerTrace, chargerTraceChat } from './api'
import { VALEURS } from './libelles'
import { autourDuTicket, jsonLisible, nombreDeLignes, secondesTexte, surligner, type Segment } from './trace'
import type {
  Bloc,
  BlocControleur,
  BlocDelais,
  BlocGardeEntree,
  BlocGardeSortie,
  BlocRedacteur,
  BlocTri,
  StatutLot,
  Trace,
} from './types'

const INTERVALLE = 2000
const EN_COURS: StatutLot[] = ['en_attente', 'en_cours']

/** Le ticket dont on lit la trace : le ticket n d'un lot, ou un ticket du chat (référence VLT-…). */
export type SourceTrace = { lot: string; n: number } | { ref: string }

/** Charge la trace, puis la relit toutes les 2 s tant que le lot (ou le ticket du chat) tourne. */
function useTrace(source: SourceTrace): [Ressource<Trace>, () => void] {
  const [lu, setLu] = useState<{ cle: string; trace: Ressource<Trace> } | null>(null)
  const [essai, setEssai] = useState(0)
  const cle = 'ref' in source ? source.ref : `${source.lot}/${source.n}`
  useEffect(() => {
    const controle = new AbortController()
    let minuterie: ReturnType<typeof setTimeout> | undefined
    const lire = (signal: AbortSignal) => {
      if (cle.startsWith('VLT-')) return chargerTraceChat(cle, signal)
      const [lot, n] = cle.split('/')
      return chargerTrace(lot!, Number(n), signal)
    }
    const charger = () =>
      lire(controle.signal).then(
        (donnees) => {
          setLu({ cle, trace: { etat: 'pret', donnees } })
          if (EN_COURS.includes(donnees.statut_lot)) minuterie = setTimeout(charger, INTERVALLE)
        },
        () => {
          if (!controle.signal.aborted) setLu({ cle, trace: { etat: 'erreur' } })
        },
      )
    void charger()
    return () => {
      controle.abort()
      clearTimeout(minuterie)
    }
  }, [cle, essai])
  return [lu?.cle === cle ? lu.trace : { etat: 'chargement' }, () => setEssai((x) => x + 1)]
}

// --- Petits éléments ----------------------------------------------------------------

/** Segments rendus en nœuds texte ; les passages marqués dans un <mark>, jamais du HTML. */
export function Segments({ segments, ton }: { segments: Segment[]; ton: 'danger' | 'accent' }) {
  const marque =
    ton === 'danger'
      ? 'rounded-[3px] bg-[rgb(var(--danger-rgb)/0.12)] text-text underline decoration-danger decoration-dotted underline-offset-2'
      : 'rounded-[3px] bg-[rgb(var(--accent-rgb)/0.14)] text-text'
  return (
    <>
      {segments.map((s, i) =>
        s.marque ? (
          <mark key={i} data-marque="" className={marque}>
            {s.texte}
          </mark>
        ) : (
          <span key={i}>{s.texte}</span>
        ),
      )}
    </>
  )
}

const PRE = 'font-mono text-[0.75rem] leading-5 whitespace-pre-wrap break-words text-text'

/** Texte long (prompt, réponse) dans une boîte qui défile, ouverte sur le passage marqué. */
function Boite({ children, haute = false, label }: { children: ReactNode; haute?: boolean; label: string }) {
  const boite = useRef<HTMLPreElement>(null)
  useLayoutEffect(() => {
    const b = boite.current
    const m = b?.querySelector<HTMLElement>('[data-marque]')
    if (b && m && b.scrollHeight > b.clientHeight) b.scrollTop = Math.max(0, m.offsetTop - b.offsetTop - 48)
  }, [])
  return (
    <pre
      ref={boite}
      tabIndex={0}
      aria-label={label}
      className={`${PRE} overflow-y-auto rounded-[10px] border border-line bg-surface-2 px-3 py-2 ${haute ? 'max-h-[360px]' : 'max-h-[220px]'}`}
    >
      {children}
    </pre>
  )
}

function Rubrique({ titre, note, children }: { titre: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <h4 className="text-[0.75rem] font-medium text-text-2">
        {titre}
        {note && <span className="font-normal"> · {note}</span>}
      </h4>
      {children}
    </div>
  )
}

function OuiNon({ oui, danger = false }: { oui: boolean; danger?: boolean }) {
  const fond = oui && danger ? 'bg-[rgb(var(--danger-rgb)/0.12)]' : oui ? 'bg-[rgb(var(--accent-rgb)/0.12)]' : 'bg-surface-2'
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.75rem] leading-4 font-medium text-text ${fond}`}>{oui ? 'Oui' : 'Non'}</span>
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.75rem] text-text">{children}</code>
}

const CHAMPS_TRI: { cle: string; libelle: string; valeurs?: Record<string, string> }[] = [
  { cle: 'label', libelle: 'Catégorie', valeurs: VALEURS.categorie },
  { cle: 'sous_motif', libelle: 'Sous-motif' },
  { cle: 'product', libelle: 'Produit', valeurs: VALEURS.produit },
  { cle: 'severity', libelle: 'Gravité', valeurs: VALEURS.severite },
  { cle: 'is_complaint', libelle: 'Réclamation' },
  { cle: 'unauthorized_payment', libelle: 'Paiement non autorisé' },
  { cle: 'injection_suspected', libelle: 'Injection suspectée' },
]

/** Deux colonnes : ce qui entre, ce qui sort (l'une sous l'autre sur mobile). */
function EntreSort({ entre, sort }: { entre: ReactNode; sort: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-5 lg:grid-cols-2">
      <section aria-label="Ce qui entre" className="min-w-0 space-y-4">
        <p className="text-[0.6875rem] font-semibold tracking-[0.06em] text-text-2 uppercase">Entre</p>
        {entre}
      </section>
      <section aria-label="Ce qui sort" className="min-w-0 space-y-4 lg:border-l lg:border-line lg:pl-6">
        <p className="text-[0.6875rem] font-semibold tracking-[0.06em] text-text-2 uppercase">Sort</p>
        {sort}
      </section>
    </div>
  )
}

// --- Les six blocs ------------------------------------------------------------------

function GardeEntree({ b }: { b: BlocGardeEntree }) {
  const retires = b.retires ?? []
  return (
    <EntreSort
      entre={
        <Rubrique titre="Texte reçu" note={retires.length ? 'passages retirés soulignés' : undefined}>
          <Boite label="Texte reçu">
            <Segments segments={surligner(b.texte_recu ?? '', retires.map((r) => r.text))} ton="danger" />
          </Boite>
        </Rubrique>
      }
      sort={
        <>
          <Rubrique titre="Signal d’injection">
            <p className="flex items-center gap-2 text-petit text-text">
              <OuiNon oui={!!b.signal} danger />
              {b.signal ? 'Au moins un motif trouvé : le ticket sera marqué suspect.' : 'Aucun motif trouvé.'}
            </p>
          </Rubrique>
          <Rubrique titre={`Passages retirés (${retires.length})`}>
            {retires.length ? (
              <ul className="space-y-2">
                {retires.map((r, i) => (
                  <li key={i} className="rounded-[10px] bg-[rgb(var(--danger-rgb)/0.06)] px-3 py-2">
                    <span className="block text-[0.75rem] font-medium text-danger">{r.rule}</span>
                    <span className={PRE}>{r.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-petit text-text-2">Aucun : le texte passe tel quel.</p>
            )}
          </Rubrique>
          <Rubrique titre="Texte envoyé aux modèles">
            <Boite label="Texte envoyé aux modèles">{b.texte_envoye}</Boite>
          </Rubrique>
        </>
      }
    />
  )
}

function Tri({ b }: { b: BlocTri }) {
  const champs = b.champs ?? {}
  return (
    <EntreSort
      entre={
        <Rubrique titre="Prompt réellement envoyé" note={<>prompts/v7_sous_motif.txt, ticket inséré surligné</>}>
          <Boite haute label="Prompt envoyé au tri">
            <Segments segments={autourDuTicket(b.prompt ?? '', b.ticket_insere)} ton="accent" />
          </Boite>
          <p className="text-[0.75rem] text-text-2">
            {nombreDeLignes(b.prompt ?? '')} lignes. Sortie contrainte par le schéma JSON (<Code>format</Code> d’Ollama),
            température 0.
          </p>
        </Rubrique>
      }
      sort={
        <>
          <Rubrique titre="Réponse brute du modèle">
            <Boite label="Réponse brute du tri">{b.reponse_brute}</Boite>
          </Rubrique>
          <Rubrique titre="Champs extraits">
            <dl className="divide-y divide-line rounded-[10px] border border-line">
              {CHAMPS_TRI.map(({ cle, libelle, valeurs }) => {
                const v = champs[cle]
                return (
                  <div key={cle} className="flex items-baseline justify-between gap-3 px-3 py-1.5 text-petit">
                    <dt className="text-text-2">{libelle}</dt>
                    <dd className="text-right text-text">
                      {typeof v === 'boolean' ? (
                        <OuiNon oui={v} danger={cle === 'injection_suspected'} />
                      ) : (
                        <>
                          <Code>{String(v ?? '')}</Code>
                          {valeurs?.[String(v)] && <span className="text-text-2"> ({valeurs[String(v)]})</span>}
                        </>
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>
            {b.injection && (
              <p className="text-[0.75rem] text-text-2">
                Injection suspectée = avis du modèle ({b.injection.modele ? 'oui' : 'non'}) ou garde d’entrée (
                {b.injection.garde ? 'oui' : 'non'}).
              </p>
            )}
          </Rubrique>
        </>
      }
    />
  )
}

function Controleur({ b }: { b: BlocControleur }) {
  return (
    <EntreSort
      entre={
        <Rubrique titre="Prompt réellement envoyé" note="section 2 bis du guide, ticket inséré surligné">
          <Boite haute label="Prompt envoyé au contrôleur">
            <Segments segments={autourDuTicket(b.prompt ?? '', b.ticket_insere)} ton="accent" />
          </Boite>
        </Rubrique>
      }
      sort={
        <>
          <Rubrique titre="Réponse brute du modèle">
            <Boite label="Réponse brute du contrôleur">{b.reponse_brute}</Boite>
          </Rubrique>
          <Rubrique titre="Face au tri">
            <div className="grid grid-cols-2 gap-2 text-petit">
              <div className="rounded-[10px] bg-surface-2 px-3 py-2">
                <span className="block text-[0.75rem] text-text-2">Tri (llama)</span>
                <Code>{b.sous_motif_tri}</Code>
              </div>
              <div className="rounded-[10px] bg-surface-2 px-3 py-2">
                <span className="block text-[0.75rem] text-text-2">Contrôleur (qwen)</span>
                <Code>{b.sous_motif}</Code>
              </div>
            </div>
            <p className="flex items-start gap-2 text-petit text-text">
              {b.accord ? (
                <CheckCircleIcon size={16} weight="fill" className="mt-px shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <XCircleIcon size={16} weight="fill" className="mt-px shrink-0 text-danger" aria-hidden="true" />
              )}
              <span>
                <span className="font-medium">{b.accord ? 'Accord' : 'Désaccord'} avec le tri.</span>{' '}
                <span className="text-text-2">Garde-fou de la fiche : {b.garde_fou_texte}.</span>
              </span>
            </p>
          </Rubrique>
        </>
      }
    />
  )
}

function Redacteur({ b }: { b: BlocRedacteur }) {
  const appels = b.appels ?? []
  const fuite = b.ticket_dans_prompt
  return (
    <EntreSort
      entre={
        <>
          <div
            className={`flex items-start gap-2.5 rounded-[10px] px-3 py-2.5 text-petit text-text ${
              fuite ? 'bg-[rgb(var(--danger-rgb)/0.08)]' : 'bg-[rgb(var(--accent-rgb)/0.08)]'
            }`}
          >
            <EyeSlashIcon size={18} className={`mt-px shrink-0 ${fuite ? 'text-danger' : 'text-accent'}`} aria-hidden="true" />
            <p>
              <span className="font-medium">Le rédacteur ne voit pas le ticket.</span> Il reçoit seulement des faits
              construits en code ({(b.champs_envoyes ?? []).length} champs), jamais le texte du client ni un résumé.{' '}
              {fuite ? (
                <span className="text-danger">Vérification : la suite « {fuite} » du ticket figure dans le prompt.</span>
              ) : (
                <span className="text-text-2">Vérifié sur le prompt envoyé : aucune suite de 5 mots du ticket n’y figure.</span>
              )}
            </p>
          </div>
          <Rubrique titre="Faits reçus" note="tout ce que le modèle sait du ticket">
            <Boite haute label="Faits reçus par le rédacteur">{JSON.stringify(b.faits_envoyes ?? {}, null, 1)}</Boite>
          </Rubrique>
          <Rubrique titre="Fiche de réponse">
            <p className="text-petit text-text">
              {b.fiche ? (
                <>
                  Fiche <Code>{b.fiche}</Code> utilisée
                </>
              ) : (
                'Pas de fiche : brouillon générique'
              )}
              <span className="text-text-2"> · {b.fiche_texte}.</span>
            </p>
          </Rubrique>
          {appels.map((a, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer text-[0.75rem] font-medium text-accent">
                Prompt complet{appels.length > 1 ? ` (appel ${i + 1} sur ${appels.length})` : ''},{' '}
                {nombreDeLignes(a.prompt)} lignes
              </summary>
              <div className="mt-2">
                <Boite haute label={`Prompt du rédacteur, appel ${i + 1}`}>{a.prompt}</Boite>
              </div>
            </details>
          ))}
        </>
      }
      sort={
        appels.map((a, i) => (
          <Rubrique
            key={i}
            titre={appels.length > 1 ? `Brouillon du modèle, appel ${i + 1}` : 'Brouillon du modèle'}
            note={appels.length > 1 && i === 1 ? 'refait sans fiche' : secondesTexte(a.secondes)}
          >
            <Boite haute label={`Brouillon du modèle, appel ${i + 1}`}>{jsonLisibleBrouillon(a.reponse_brute)}</Boite>
          </Rubrique>
        ))
      }
    />
  )
}

/** Le rédacteur répond {"brouillon": "..."} : on montre le texte du brouillon, retours à la ligne compris. */
function jsonLisibleBrouillon(brut: string): string {
  try {
    const v = JSON.parse(brut) as { brouillon?: unknown }
    if (typeof v.brouillon === 'string') return v.brouillon
  } catch {
    // réponse illisible : on la montre telle quelle
  }
  return jsonLisible(brut)
}

const RESULTAT = {
  ok: { Icone: CheckCircleIcon, couleur: 'text-accent', texte: 'Passe' },
  violation: { Icone: XCircleIcon, couleur: 'text-danger', texte: 'Violation' },
  'sans objet': { Icone: MinusCircleIcon, couleur: 'text-text-2', texte: 'Sans objet' },
} as const

function GardeSortie({ b }: { b: BlocGardeSortie }) {
  return (
    <EntreSort
      entre={
        <p className="text-petit text-text-2">
          Le brouillon du modèle (bloc 4) et, côté code seulement, le texte du ticket : pour repérer un nom ou un numéro
          recopié. Les dates d’échéance calculées sont permises.
        </p>
      }
      sort={
        <>
          <Rubrique titre="Vérifications" note="sur le premier brouillon du modèle">
            <ul className="divide-y divide-line rounded-[10px] border border-line">
              {(b.verifications ?? []).map((v) => {
                const r = RESULTAT[v.resultat]
                return (
                  <li key={v.regle} className="flex items-start gap-2.5 px-3 py-2 text-petit">
                    <r.Icone size={16} weight="fill" className={`mt-px shrink-0 ${r.couleur}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-text">
                      {v.texte}
                      {v.trouve && <span className="block text-[0.75rem] text-danger">Trouvé : « {v.trouve} »</span>}
                    </span>
                    <span className={`shrink-0 text-[0.75rem] font-medium ${r.couleur}`}>{r.texte}</span>
                  </li>
                )
              })}
            </ul>
            <p className="flex items-center gap-2 text-petit text-text">
              {b.bloque ? (
                <>
                  <ShieldWarningIcon size={16} className="text-danger" aria-hidden="true" />
                  Brouillon bloqué : remplacé par le modèle fixe écrit en code.
                </>
              ) : (
                <>
                  <CheckCircleIcon size={16} weight="fill" className="text-accent" aria-hidden="true" />
                  Brouillon accepté.
                </>
              )}
            </p>
          </Rubrique>
          <Rubrique titre="Dates" note={b.dates}>
            <p className="text-petit text-text">{b.dates_texte}.</p>
          </Rubrique>
          <Rubrique titre="Brouillon remis au conseiller">
            <Boite haute label="Brouillon final">{b.brouillon}</Boite>
          </Rubrique>
        </>
      }
    />
  )
}

const CANAL: Record<string, string> = { email: 'Email', form: 'Formulaire', chat: 'Chat' }

function Delais({ b }: { b: BlocDelais }) {
  const echeances = b.echeances ?? []
  const feries = b.feries ?? []
  const ligne = (libelle: string, valeur: ReactNode) => (
    <div className="flex items-baseline justify-between gap-3 px-3 py-1.5 text-petit">
      <dt className="text-text-2">{libelle}</dt>
      <dd className="text-right text-text">{valeur}</dd>
    </div>
  )
  return (
    <EntreSort
      entre={
        <dl className="divide-y divide-line rounded-[10px] border border-line">
          {ligne('Canal', <>{CANAL[b.canal ?? ''] ?? b.canal}{b.canal_par_defaut && <span className="text-text-2"> (par défaut)</span>}</>)}
          {ligne('Reçu le', <>{b.recu_le_texte}{b.recu_par_defaut && <span className="text-text-2"> (lancement du lot)</span>}</>)}
          {ligne('Réclamation (tri)', <OuiNon oui={!!b.reclamation} />)}
          {ligne('Paiement non autorisé (tri)', <OuiNon oui={!!b.paiement_non_autorise} />)}
          {ligne('Produit (tri)', <Code>{b.produit}</Code>)}
        </dl>
      }
      sort={
        <>
          <Rubrique titre="Échéances calculées" note="en code, jamais par un modèle">
            <ul className="space-y-2">
              {echeances.map((e) => (
                <li key={e.kind} className="rounded-[10px] border border-line px-3 py-2">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 text-petit">
                    <span className="font-medium text-text">{e.etape}</span>
                    <span className="montant text-text">{e.date_texte}</span>
                  </span>
                  <span className="block text-[0.75rem] text-text-2">
                    {e.regle} · {e.source}
                  </span>
                  {e.avancee && (
                    <span className="block text-[0.75rem] text-text">
                      Tombait le {e.avancee.de}, jour non ouvrable : avancée au jour ouvrable précédent.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Rubrique>
          <Rubrique titre="Jours fériés pris en compte" note="entre la réception et la dernière échéance">
            {feries.length ? (
              <ul className="space-y-1 text-petit text-text">
                {feries.map((f) => (
                  <li key={f.date}>
                    {f.nom} <span className="text-text-2">· {f.texte}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-petit text-text-2">Aucun sur cette période.</p>
            )}
            <p className="text-[0.75rem] text-text-2">Les samedis, dimanches et jours fériés ne comptent pas comme jours ouvrables.</p>
          </Rubrique>
        </>
      }
    />
  )
}

function Contenu({ b }: { b: Bloc }) {
  switch (b.cle) {
    case 'garde_entree':
      return <GardeEntree b={b} />
    case 'tri':
      return <Tri b={b} />
    case 'controleur':
      return <Controleur b={b} />
    case 'redacteur':
      return <Redacteur b={b} />
    case 'garde_sortie':
      return <GardeSortie b={b} />
    case 'delais':
      return <Delais b={b} />
  }
}

/** Titres affichés (l'API envoie les siens, sans apostrophe typographique). */
const TITRE: Record<Bloc['cle'], string> = {
  garde_entree: 'Garde d’entrée',
  tri: 'Tri',
  controleur: 'Contrôleur',
  redacteur: 'Rédacteur',
  garde_sortie: 'Garde de sortie',
  delais: 'Délais',
}

function Etape({ b, rang }: { b: Bloc; rang: number }) {
  const fait = b.etat === 'fait'
  return (
    <li className="bloc p-5" aria-labelledby={`etape-${b.cle}`}>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className={`montant flex size-7 shrink-0 items-center justify-center rounded-full text-petit font-semibold ${
            fait ? 'bg-accent text-on-accent' : 'bg-surface-2 text-text-2'
          }`}
        >
          {rang}
        </span>
        <h3 id={`etape-${b.cle}`} className="text-corps font-semibold text-text">
          <span className="sr-only">Étape {rang} : </span>
          {TITRE[b.cle]}
        </h3>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[0.6875rem] text-text-2">{b.qui}</span>
        {fait && <span className="montant ml-auto text-petit text-text-2">{secondesTexte(b.secondes)}</span>}
      </div>
      {b.etat === 'fait' && <Contenu b={b} />}
      {b.etat === 'en_attente' && <p className="text-petit text-text-2">En attente : ce ticket n’a pas encore passé cette étape.</p>}
      {b.etat === 'sans_brouillon' && <p className="text-petit text-text-2">{b.message}</p>}
    </li>
  )
}

/** La trace d'un ticket, sans chargement (pour les tests et le rendu statique). */
export function VuePipeline({ trace }: { trace: Trace }) {
  const total = trace.blocs.reduce((s, b) => s + (b.etat === 'fait' ? (b.secondes ?? 0) : 0), 0)
  return (
    <>
      <div className="space-y-2">
        <p className="text-petit text-text-2">
          Trace enregistrée pendant le lot : rien n’est relancé pour l’afficher.
          {trace.trace && <> Somme des étapes : <span className="montant">{secondesTexte(total)}</span>.</>}
        </p>
        {!trace.trace && !EN_COURS.includes(trace.statut_lot) && (
          <p role="status" className="flex items-start gap-2 text-petit text-text">
            <WarningCircleIcon size={16} className="mt-px shrink-0 text-danger" aria-hidden="true" />
            Aucune trace pour ce ticket : le lot a été trié avant l’enregistrement des traces, ou arrêté avant lui.
          </p>
        )}
      </div>
      <ol className="space-y-4">
        {trace.blocs.map((b, i) => (
          <Etape key={b.cle} b={b} rang={i + 1} />
        ))}
      </ol>
    </>
  )
}

/** Onglet Pipeline : un ticket (d'un lot ou du chat), étape par étape. */
export function Pipeline({
  source,
  onRetour,
  retour = 'Retour au lot',
}: {
  source: SourceTrace
  onRetour: () => void
  retour?: string
}) {
  const [trace, recharger] = useTrace(source)
  return (
    <section aria-labelledby="titre-pipeline" className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onRetour}
          className="pressable flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-petit font-medium text-text hover:bg-surface-2"
        >
          <ArrowLeftIcon size={16} aria-hidden="true" />
          {retour}
        </button>
        <h2 id="titre-pipeline" className="text-section font-semibold tracking-[-0.01em] text-text">
          Pipeline du ticket{' '}
          <span className="montant">{trace.etat === 'pret' ? trace.donnees.id : 'ref' in source ? source.ref : `#${source.n}`}</span>
        </h2>
      </div>
      {trace.etat === 'chargement' && (
        <div aria-busy="true" aria-label="Chargement de la trace" className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bloc space-y-3 p-5">
              <Os className="h-5 w-40" />
              <Os className="h-24 w-full rounded-[10px]" />
            </div>
          ))}
        </div>
      )}
      {trace.etat === 'erreur' && <ErreurBloc onReessayer={recharger} />}
      {trace.etat === 'pret' && <VuePipeline trace={trace.donnees} />}
    </section>
  )
}
