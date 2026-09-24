import { useEffect, useState, type AnimationEvent, type CSSProperties, type ReactNode } from 'react'
import {
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  ClockIcon,
  HourglassIcon,
  TrayIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import type { Echeance, Statut, TicketSuivi } from '../api/contrat'
import { LIBELLE_STATUT, joursOuvresRestants } from '../libelles'
import { SurfaceVerre } from './SurfaceVerre'
import './carte.css'

const ICONE_STATUT: Record<Statut, typeof TrayIcon> = {
  recue: TrayIcon,
  en_cours: HourglassIcon,
  reponse_envoyee: CheckIcon,
}

type Entree = 'joue' | 'fini'

/** L'apparition joue une fois par ticket et par session ; un appui ou un défilement l'arrête. */
function useEntreeUnique(reference: string): [Entree, () => void] {
  const cle = `vault:carte-vue:${reference}`
  const [entree, setEntree] = useState<Entree>(() => {
    try {
      return sessionStorage.getItem(cle) ? 'fini' : 'joue'
    } catch {
      return 'joue'
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(cle, '1')
    } catch {
      // stockage indisponible : l'animation rejouera, sans autre effet
    }
  }, [cle])

  useEffect(() => {
    if (entree === 'fini') return
    const arreter = () => setEntree('fini')
    const evenements = ['pointerdown', 'wheel', 'touchmove', 'keydown', 'scroll'] as const
    evenements.forEach((e) => window.addEventListener(e, arreter, { passive: true, once: true }))
    return () => evenements.forEach((e) => window.removeEventListener(e, arreter))
  }, [entree])

  return [entree, () => setEntree('fini')]
}

/**
 * La date légale, toujours sur deux lignes : « jeudi 24 » puis « septembre 2026 ».
 * Le texte vient tel quel de l'API ; le front choisit seulement où couper.
 */
function DateLegale({ texte }: { texte: string }) {
  const mots = texte.split(' ')
  return (
    <p className="date-legale mt-1 text-date font-semibold text-legal">
      <span className="block">{mots.slice(0, 2).join('\u00a0')}</span>
      <span className="block">{mots.slice(2).join(' ')}</span>
    </p>
  )
}

/**
 * Nom du repère intermédiaire, au-dessus du rail, aligné sur l'anneau : par la
 * gauche dans la première moitié du rail, par la droite dans la seconde. Les
 * marges intérieures suivent la position ; si la place manque, le nom passe à
 * la ligne au lieu de déborder.
 */
function RepereNomme({ accuse }: { accuse: Echeance }) {
  const p = Math.min(Math.max(accuse.position, 0), 1)
  const style =
    p <= 0.5
      ? { paddingLeft: `max(0px, calc(${p * 100}% - 5px))`, textAlign: 'left' as const }
      : { paddingRight: `max(0px, calc(${(1 - p) * 100}% - 5px))`, textAlign: 'right' as const }
  return (
    <p className="mb-1 text-legende font-medium text-text-2" style={style}>
      Accusé de réception, {accuse.court}
    </p>
  )
}

function Ligne({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-text" aria-hidden="true">
        {icone}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  )
}

export function CarteSuivi({ ticket }: { ticket: TicketSuivi }) {
  const [entree, finir] = useEntreeUnique(ticket.reference)
  const reponse = ticket.echeances.find((e) => e.kind === 'reponse')
  const accuse = ticket.echeances.find((e) => e.kind === 'accuse_reception')
  const IconeStatut = ICONE_STATUT[ticket.statut]
  const p = (v: number) => ({ '--p': Math.min(Math.max(v, 0), 1) }) as CSSProperties

  if (!reponse) return null

  return (
    <SurfaceVerre
      as="section"
      aria-label="Suivi du délai de réponse"
      className="carte-suivi p-6"
      data-entree={entree}
      onAnimationEnd={(e: AnimationEvent) => {
        if (e.animationName === 'rail-entree' || e.animationName === 'fondu') finir()
      }}
    >
      <p className="text-libelle font-medium text-text-2">Réponse au plus tard le</p>
      <DateLegale texte={reponse.texte} />

      <div
        className="rail mt-6"
        role="img"
        aria-label={`Délai écoulé : ${Math.round(Math.min(ticket.progression, 1) * 100)} %`}
      >
        {accuse && <RepereNomme accuse={accuse} />}
        <div className="rail-zone">
          <div className="rail-piste" />
          <div className="rail-rempli" style={p(ticket.progression)} />
          {accuse && (
            <div className="rail-repere" style={p(accuse.position)}>
              <span className="rail-anneau" data-envoye={accuse.envoye_le ? true : undefined} />
            </div>
          )}
          <div className="rail-repere" data-perle style={p(ticket.progression)}>
            <span className="rail-perle" />
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-4 text-legende font-medium text-text-2">
        <span>Reçue le {ticket.recu_le.court}</span>
        <span>Échéance {reponse.court}</span>
      </div>

      {(accuse || ticket.delai !== 'normal') && (
      <ul className="mt-6 space-y-4 text-libelle">
        {ticket.delai === 'proche' && (
          <Ligne icone={<ClockIcon size={20} />}>
            <span className="font-medium text-text">{joursOuvresRestants(ticket.jours_ouvres_restants)}</span>
          </Ligne>
        )}
        {ticket.delai === 'depasse' && (
          <Ligne icone={<WarningCircleIcon size={20} />}>
            <span className="text-text">
              <span className="font-medium">Échéance dépassée le {reponse.texte}.</span> Un conseiller
              traite votre demande.
            </span>
          </Ligne>
        )}
        {accuse &&
          (accuse.envoye_le ? (
            <Ligne icone={<CheckCircleIcon size={20} />}>
              <span className="block font-medium text-text">Accusé de réception envoyé</span>
              <span className="block text-text-2">le {accuse.envoye_le.texte}</span>
            </Ligne>
          ) : (
            <Ligne icone={<CircleIcon size={20} className="text-text-2" />}>
              <span className="block font-medium text-text">Accusé de réception</span>
              <span className="block text-text-2">au plus tard le {accuse.texte}</span>
            </Ligne>
          ))}
      </ul>
      )}

      <div className="mt-6 border-t border-line pt-4">
        <p className="flex items-center gap-3 text-libelle font-medium text-text">
          <IconeStatut size={20} aria-hidden="true" />
          {LIBELLE_STATUT[ticket.statut]}
        </p>
        {ticket.reponse_envoyee_le && (
          <p className="mt-1 pl-8 text-libelle text-text-2">le {ticket.reponse_envoyee_le.texte}</p>
        )}
        <p className="chiffres mt-1 pl-8 text-legende font-medium whitespace-nowrap text-text-2">
          Réf. {ticket.reference}
        </p>
      </div>
    </SurfaceVerre>
  )
}
