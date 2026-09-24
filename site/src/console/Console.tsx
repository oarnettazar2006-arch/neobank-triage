import { ArrowLeftIcon, TableIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useRessource, type Ressource } from '../api'
import { BoutonTheme } from '../composants/BarreHaut'
import { ErreurBloc, Os } from '../composants/Etats'
import { Logo } from '../composants/Logo'
import { Analyse } from './Analyse'
import { arreterLot, chargerLot, creerLot, listerLots } from './api'
import { Entree } from './Entree'
import { duree } from './retenir'
import { TableauTickets } from './TableauTickets'
import type { Lot, LotResume, StatutLot } from './types'

const STATUT: Record<StatutLot, string> = {
  en_attente: 'en attente',
  en_cours: 'en cours',
  termine: 'terminé',
  erreur: 'erreur',
  arrete: 'arrêté',
}
const EN_COURS: StatutLot[] = ['en_attente', 'en_cours']
const INTERVALLE = 2000

/** Le lot affiché, dans l'adresse (?lot=LOT-XXXXXX) : un rechargement le garde. */
function lotDeLAdresse(): string | null {
  return new URLSearchParams(window.location.search).get('lot')
}

function ecrireAdresse(id: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('lot', id)
  window.history.replaceState(null, '', url)
}

/** Charge le lot, puis l'interroge toutes les 2 s tant que le tri tourne. */
function useLot(id: string | null, onFini: () => void): [Ressource<Lot> | null, () => void] {
  // Rangé avec son identifiant : un autre lot se lit « chargement » sans remise à zéro dans l'effet.
  const [lu, setLu] = useState<{ id: string; lot: Ressource<Lot> } | null>(null)
  const [essai, setEssai] = useState(0)
  const fini = useRef(onFini)
  useEffect(() => {
    fini.current = onFini
  })

  useEffect(() => {
    if (!id) return
    const controle = new AbortController()
    let minuterie: ReturnType<typeof setTimeout> | undefined
    let tournait = false
    const charger = () =>
      chargerLot(id, controle.signal).then(
        (donnees) => {
          setLu({ id, lot: { etat: 'pret', donnees } })
          const tourne = EN_COURS.includes(donnees.statut)
          if (tourne) minuterie = setTimeout(charger, INTERVALLE)
          else if (tournait) fini.current()
          tournait = tourne
        },
        () => {
          if (!controle.signal.aborted) setLu({ id, lot: { etat: 'erreur' } })
        },
      )
    void charger()
    return () => {
      controle.abort()
      clearTimeout(minuterie)
    }
  }, [id, essai])

  const lot: Ressource<Lot> | null = !id ? null : lu?.id === id ? lu.lot : { etat: 'chargement' }
  return [lot, () => setEssai((n) => n + 1)]
}

function BarreLaterale({ lots, actif, onChoisir }: { lots: Ressource<LotResume[]>; actif: string | null; onChoisir: (id: string) => void }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo />
        <span className="text-petit text-text-2">Console</span>
      </div>
      <nav aria-label="Console" className="px-3">
        <a
          href="/console"
          aria-current="page"
          className="pressable flex h-10 items-center gap-3 rounded-full bg-[rgb(var(--accent-rgb)/0.1)] px-3 text-petit font-medium text-accent"
        >
          <TableIcon size={20} weight="fill" aria-hidden="true" />
          Tri d’un lot
        </a>
      </nav>
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
        <h2 className="px-3 pb-2 text-[0.75rem] font-medium text-text-2">Lots récents</h2>
        {lots.etat === 'chargement' && (
          <div aria-busy="true" className="space-y-3 px-3">
            <Os className="h-4 w-36" />
            <Os className="h-4 w-28" />
          </div>
        )}
        {lots.etat === 'erreur' && <p className="px-3 text-petit text-text-2">Liste indisponible.</p>}
        {lots.etat === 'pret' && !lots.donnees.length && (
          <p className="px-3 text-petit text-text-2">Aucun lot pour l’instant.</p>
        )}
        {lots.etat === 'pret' && (
          <ul className="space-y-0.5">
            {lots.donnees.slice(0, 12).map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onChoisir(l.id)}
                  aria-current={l.id === actif ? 'true' : undefined}
                  className={`pressable w-full rounded-[10px] px-3 py-1.5 text-left ${l.id === actif ? 'bg-surface-2' : 'survol'}`}
                >
                  <span className="block truncate text-petit font-medium text-text">{l.nom}</span>
                  <span className="montant block text-[0.75rem] leading-4 text-text-2">
                    {l.tickets} ticket{l.tickets > 1 ? 's' : ''} · {STATUT[l.statut]} · {l.cree_le}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <a href="/" className="flex h-12 items-center gap-2 border-t border-line px-6 text-petit text-text-2 hover:text-text">
        <ArrowLeftIcon size={16} aria-hidden="true" />
        Espace client
      </a>
    </aside>
  )
}

function Progression({ lot, onArreter, onRelancer }: { lot: Lot; onArreter: () => void; onRelancer?: () => void }) {
  const tourne = EN_COURS.includes(lot.statut)
  const faits = lot.analyse.tickets
  if (lot.statut === 'termine')
    return (
      <p className="text-petit text-text-2">
        {lot.tickets} ticket{lot.tickets > 1 ? 's triés' : ' trié'} en {duree(lot.secondes ?? 0)}
        {lot.tickets ? ` (${((lot.secondes ?? 0) / lot.tickets).toFixed(1).replace('.', ',')} s par ticket)` : ''} ·
        étapes : {lot.etapes.join(', ')}
      </p>
    )
  if (!tourne) {
    const cause =
      lot.statut === 'arrete'
        ? 'Tri arrêté à votre demande.'
        : lot.erreur === 'interrompu'
          ? 'L’API s’est arrêtée pendant le tri.'
          : 'Le tri s’est arrêté : Ollama ne répond pas, ou sa réponse est illisible.'
    return (
      <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[12px] bg-[rgb(var(--danger-rgb)/0.08)] px-4 py-3">
        <p className="flex min-w-0 flex-1 items-start gap-2 text-petit text-text">
          <WarningCircleIcon size={16} className="mt-px shrink-0 text-danger" aria-hidden="true" />
          <span>
            {cause} {faits} ticket{faits > 1 ? 's' : ''} trié{faits > 1 ? 's' : ''} sur {lot.tickets} restent affichés.
            {lot.erreur && lot.erreur !== 'interrompu' && <span className="block text-text-2">{lot.erreur}</span>}
          </span>
        </p>
        {onRelancer && (
          <button
            type="button"
            onClick={onRelancer}
            className="pressable h-8 rounded-full border border-line bg-surface px-4 text-petit font-medium text-text hover:bg-surface-2"
          >
            Relancer
          </button>
        )}
      </div>
    )
  }
  const i = lot.etapes.indexOf(lot.etape ?? '')
  const dansEtape = i < 0 ? 0 : lot.fait - i * lot.tickets
  const suivante = i >= 0 ? lot.etapes[i + 1] : undefined
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="min-w-0 flex-1">
        <p aria-live="polite" className="text-petit text-text">
          {lot.statut === 'en_attente' ? (
            'En attente du modèle…'
          ) : (
            <>
              <span className="font-medium capitalize">{lot.etape}</span>
              <span className="montant"> : {dansEtape} sur {lot.tickets}</span>
              {suivante && <span className="text-text-2"> · puis {suivante}</span>}
              {lot.reste_s != null && lot.fait > 0 && <span className="text-text-2"> · reste environ {duree(lot.reste_s)}</span>}
            </>
          )}
        </p>
        <div
          role="progressbar"
          aria-label="Avancement du tri"
          aria-valuemin={0}
          aria-valuemax={lot.total}
          aria-valuenow={lot.fait}
          className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${(100 * lot.fait) / Math.max(1, lot.total)}%` }} />
        </div>
      </div>
      <button
        type="button"
        onClick={onArreter}
        className="pressable h-8 rounded-full border border-danger px-4 text-petit font-medium text-danger"
      >
        Arrêter
      </button>
    </div>
  )
}

/** Console conseiller (/console) : trier un CSV ou un ticket, suivre le tri, lire l'analyse. */
export function Console() {
  const [lots, rechargerLots] = useRessource(listerLots)
  const [lotId, setLotId] = useState<string | null>(lotDeLAdresse)
  const [source, setSource] = useState<{ id: string; nom: string; contenu: string } | null>(null)
  const [lot, rechargerLot] = useLot(lotId, rechargerLots)

  useEffect(() => {
    document.title = 'Console · VAULT'
  }, [])

  const choisir = (id: string) => {
    setLotId(id)
    ecrireAdresse(id)
  }
  const lance = (id: string, s: { nom: string; contenu: string }) => {
    setSource({ id, ...s })
    choisir(id)
    rechargerLots()
  }
  const arreter = async (id: string) => {
    if (!window.confirm('Arrêter le tri ? Les tickets déjà triés restent affichés.')) return
    try {
      await arreterLot(id)
    } finally {
      rechargerLot()
    }
  }

  const l = lot?.etat === 'pret' ? lot.donnees : null
  const relancer =
    l && source?.id === l.id
      ? () => {
          creerLot(source.nom, source.contenu).then(
            (nouveau) => lance(nouveau.id, source),
            () => rechargerLot(),
          )
        }
      : undefined

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <BarreLaterale lots={lots} actif={lotId} onChoisir={choisir} />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-8">
            <span className="flex items-center gap-3">
              <span className="lg:hidden">
                <Logo />
              </span>
              <h1 className="text-[1.0625rem] font-semibold text-text">Tri d’un lot</h1>
            </span>
            <BoutonTheme />
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] space-y-8 px-5 pt-6 pb-16 lg:px-8">
          <Entree onLance={lance} />

          {lot?.etat === 'chargement' && (
            <div aria-busy="true" aria-label="Chargement du lot" className="bloc space-y-3 p-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Os key={i} className="h-10 w-full rounded-[8px]" />
              ))}
            </div>
          )}
          {lot?.etat === 'erreur' && <ErreurBloc onReessayer={rechargerLot} />}
          {l && (
            <>
              <section aria-labelledby="titre-lot" className="bloc p-5">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                  <h2 id="titre-lot" className="truncate text-section font-semibold tracking-[-0.01em] text-text">
                    {l.nom}
                  </h2>
                  <span className="montant text-petit text-text-2">
                    {l.id} · lancé le {l.cree_le} · {STATUT[l.statut]}
                  </span>
                </div>
                <Progression lot={l} onArreter={() => void arreter(l.id)} onRelancer={relancer} />
              </section>
              <Analyse analyse={l.analyse} total={l.tickets} />
              <TableauTickets
                lotId={l.id}
                lignes={l.lignes}
                termine={l.statut === 'termine'}
                avecBonnes={l.lignes.some((x) => Object.keys(x.attendu).length > 0)}
              />
            </>
          )}
          {!lotId && (
            <p className="text-center text-petit text-text-2">
              Déposez un CSV ou écrivez un ticket : le tri, l’analyse et les métriques s’affichent ici.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
