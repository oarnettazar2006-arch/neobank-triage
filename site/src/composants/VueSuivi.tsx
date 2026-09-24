import { useEffect, useState, type AnimationEvent, type ReactNode } from 'react'
import {
  ChatCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  ClockIcon,
  HourglassIcon,
  TrayIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import type { Echeance, Statut, TicketSuivi } from '../api/contrat'
import { LIBELLE_CAS, LIBELLE_STATUT, ceQuiVaSePasser, joursOuvresRestants, recu } from '../libelles'
import { FeuilleMediateur } from './FeuilleMediateur'
import { Glass } from './Glass'
import { TubeDelai } from './TubeDelai'
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
    evenements.forEach((e) => window.addEventListener(e, arreter, { passive: true, once: true, capture: true }))
    return () => evenements.forEach((e) => window.removeEventListener(e, arreter, { capture: true }))
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
    <p className="date-legale mt-1 text-date font-light text-legal">
      <span className="block">{mots.slice(0, 2).join('\u00a0')}</span>
      <span className="block">{mots.slice(2).join(' ')}</span>
    </p>
  )
}

/**
 * Nom du repère intermédiaire, au-dessus du tube, aligné sur l'anneau : par la
 * gauche dans la première moitié, par la droite dans la seconde. Les marges
 * intérieures suivent la position ; si la place manque, le nom passe à la ligne.
 * 22 px : la zone où roule la bille commence à 22 px du bord du tube.
 */
function RepereNomme({ accuse }: { accuse: Echeance }) {
  const p = Math.min(Math.max(accuse.position, 0), 1)
  const style =
    p <= 0.5
      ? { paddingLeft: `calc(22px + ${p} * (100% - 44px) - 5px)`, textAlign: 'left' as const }
      : { paddingRight: `calc(22px + ${1 - p} * (100% - 44px) - 5px)`, textAlign: 'right' as const }
  return (
    <p className="mb-2 text-legende font-medium text-text-2" style={style}>
      Accusé de réception, {accuse.court}
    </p>
  )
}

/** Une étape : capsule de verre avec sa pastille (réf. 03). */
function Etape({ icone, titre, detail }: { icone: ReactNode; titre: ReactNode; detail?: ReactNode }) {
  return (
    <li>
      <Glass forme="pilule" className="flex items-center gap-3 py-2 pr-6 pl-2">
        <Glass forme="pastille" className="size-11 text-text" aria-hidden="true">
          {icone}
        </Glass>
        <span className="min-w-0 py-0.5">
          <span className="block text-libelle font-medium text-text">{titre}</span>
          {detail && <span className="block text-legende text-text-2">{detail}</span>}
        </span>
      </Glass>
    </li>
  )
}

/** L'écran de suivi, une fois le ticket chargé. */
export function VueSuivi({ ticket }: { ticket: TicketSuivi }) {
  const [entree, finir] = useEntreeUnique(ticket.reference)
  const [feuille, setFeuille] = useState(false)
  const reponse = ticket.echeances.find((e) => e.kind === 'reponse')
  const accuse = ticket.echeances.find((e) => e.kind === 'accuse_reception')
  const IconeStatut = ICONE_STATUT[ticket.statut]

  if (!reponse) return null

  return (
    <>
      <p className="mt-1 text-legende text-text-2">
        {LIBELLE_CAS[ticket.cas]} {recu(ticket.cas)} le {ticket.recu_le.texte}
      </p>
      <p className="chiffres text-legende text-text-2">Réf. {ticket.reference}</p>

      <section
        aria-label="Délai de réponse"
        className="signature mt-8"
        data-entree={entree}
        onAnimationEnd={(e: AnimationEvent) => {
          if (e.animationName === 'rail-entree' || e.animationName === 'fondu') finir()
        }}
      >
        <Glass forme="pilule" className="px-10 py-6 text-center">
          <p className="text-libelle text-text-2">Réponse au plus tard le</p>
          <DateLegale texte={reponse.texte} />
        </Glass>

        <div className="mt-6">
          {accuse && <RepereNomme accuse={accuse} />}
          <TubeDelai
            progression={ticket.progression}
            repere={accuse ? { position: accuse.position, plein: accuse.envoye_le !== null } : undefined}
            libelle={`Délai écoulé : ${Math.round(Math.min(ticket.progression, 1) * 100)} %`}
          />
          <div className="mt-2 flex justify-between gap-4 px-1 text-legende font-medium text-text-2">
            <span>Reçue le {ticket.recu_le.court}</span>
            <span>Échéance {reponse.court}</span>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="etapes">
        <h2 id="etapes" className="text-bloc font-normal text-text">
          Étapes
        </h2>
        <ul className="mt-3 space-y-2">
          {ticket.delai === 'proche' && (
            <Etape icone={<ClockIcon size={20} />} titre={joursOuvresRestants(ticket.jours_ouvres_restants)} />
          )}
          {ticket.delai === 'depasse' && (
            <Etape
              icone={<WarningCircleIcon size={20} />}
              titre={`Échéance dépassée le ${reponse.texte}. Un conseiller traite votre demande.`}
            />
          )}
          {accuse &&
            (accuse.envoye_le ? (
              <Etape
                icone={<CheckCircleIcon size={20} />}
                titre="Accusé de réception envoyé"
                detail={`le ${accuse.envoye_le.texte}`}
              />
            ) : (
              <Etape
                icone={<CircleIcon size={20} />}
                titre="Accusé de réception"
                detail={`au plus tard le ${accuse.texte}`}
              />
            ))}
          <Etape
            icone={<IconeStatut size={20} />}
            titre={LIBELLE_STATUT[ticket.statut]}
            detail={ticket.reponse_envoyee_le ? `le ${ticket.reponse_envoyee_le.texte}` : undefined}
          />
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="suite">
        <h2 id="suite" className="text-bloc font-normal text-text">
          Ce qui va se passer
        </h2>
        <p className="surface mt-3 rounded-[24px] p-5 text-corps text-text">{ceQuiVaSePasser(ticket)}</p>
      </section>

      {ticket.delai === 'depasse' && ticket.mediateur && (
        <section className="mt-8">
          <p className="text-corps text-text">Vous pouvez aussi saisir le médiateur de VAULT. C’est gratuit.</p>
          <Glass
            as="button"
            type="button"
            forme="pilule"
            interactif
            className="mt-3 h-12 px-6 text-libelle font-medium"
            onClick={() => setFeuille(true)}
          >
            Saisir le médiateur
          </Glass>
          <FeuilleMediateur
            ouverte={feuille}
            mediateur={ticket.mediateur}
            reference={ticket.reference}
            onFermer={() => setFeuille(false)}
          />
        </section>
      )}

      <Glass
        as="button"
        type="button"
        forme="pilule"
        ton="accent"
        interactif
        className="mt-8 flex h-14 w-full items-center justify-center gap-3 text-libelle font-medium"
      >
        <ChatCircleIcon size={20} aria-hidden="true" />
        Écrire au support
      </Glass>
    </>
  )
}
