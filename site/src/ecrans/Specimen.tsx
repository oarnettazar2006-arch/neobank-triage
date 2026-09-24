import type { ReactNode } from 'react'
import {
  ArrowUpIcon,
  ChatCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  HourglassIcon,
  TrayIcon,
} from '@phosphor-icons/react'
import { Glass } from '../composants/Glass'
import { Logo } from '../composants/Logo'
import { TubeDelai } from '../composants/TubeDelai'

/**
 * /specimen : chaque variante de Glass à côté du recadrage de la référence qui
 * l'inspire (DESIGN.md 4.5). Les textes des références sont déformés et leurs
 * montants hors sujet : on ne compare que la matière.
 */
function Ligne({ titre, detail, image, largeur, children }: {
  titre: string
  detail: string
  image: string
  largeur: number
  children: ReactNode
}) {
  return (
    <section className="grid gap-4 border-t border-[rgb(var(--blanc-rgb)/0.1)] py-8 lg:grid-cols-[220px_1fr_1fr] lg:items-center">
      <div>
        <h2 className="text-bloc font-normal text-text">{titre}</h2>
        <p className="mt-1 text-legende text-text-2">{detail}</p>
      </div>
      <div className="specimen-scene grid min-h-[180px] place-items-center rounded-[28px] p-8">{children}</div>
      <figure className="specimen-scene grid min-h-[180px] place-items-center rounded-[28px] p-4">
        <img src={`/specimen/${image}.jpg`} alt={`Référence : ${titre}`} width={largeur} className="h-auto max-w-full" />
        <figcaption className="sr-only">Recadrage de la référence</figcaption>
      </figure>
    </section>
  )
}

function Etape({ icone, titre, detail }: { icone: ReactNode; titre: string; detail?: string }) {
  return (
    <Glass forme="pilule" className="flex w-full items-center gap-3 py-2 pr-6 pl-2">
      <Glass forme="pastille" className="size-11 text-text">
        {icone}
      </Glass>
      <span className="min-w-0">
        <span className="block text-libelle font-medium text-text">{titre}</span>
        {detail && <span className="block text-legende text-text-2">{detail}</span>}
      </span>
    </Glass>
  )
}

export function Specimen() {
  return (
    <div className="specimen min-h-dvh px-6 py-10 text-text">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div>
            <p className="text-legende text-text-2">DESIGN.md, section 4</p>
            <h1 className="text-titre font-normal">Spécimen du verre</h1>
          </div>
          <Logo />
        </header>
        <p className="max-w-[60ch] text-corps text-text-2">
          À gauche, le composant Glass. À droite, le recadrage de la référence. On compare la matière : bords,
          reflets, profondeur. Le texte et les montants des références sont ignorés.
        </p>

        <Ligne titre="Pilule" detail="Bouton, action. Réf. 07 (Pay)." image="pilule" largeur={416}>
          <Glass as="button" type="button" forme="pilule" interactif className="flex h-[120px] w-[400px] max-w-full items-center gap-5 px-10 text-[1.75rem] font-normal">
            <ChatCircleIcon size={40} aria-hidden="true" />
            Écrire au support
          </Glass>
        </Ligne>

        <Ligne titre="Grande valeur" detail="La date légale. Réf. 05 (Send Money)." image="valeur" largeur={328}>
          <Glass forme="pilule" className="flex h-[112px] w-[312px] flex-col items-center justify-center">
            <span className="text-legende text-text-2">Réponse au plus tard le</span>
            <span className="date-legale text-[2.5rem] leading-[3rem] font-light text-legal">31 décembre</span>
          </Glass>
        </Ligne>

        <Ligne titre="Carte" detail="Grand rayon. Réf. 04 (carte virtuelle)." image="carte" largeur={326}>
          <Glass forme="carte" className="h-[206px] w-[310px] p-5">
            <div className="flex items-center gap-3">
              <Glass forme="pastille" className="size-11">
                <img src="/marque/vault-goutte@2x.png" alt="" className="h-6 w-auto" />
              </Glass>
              <span className="text-libelle">Réclamation</span>
            </div>
            <p className="mt-4 text-[2.25rem] leading-10 font-light">31 déc.</p>
            <p className="mt-3 text-legende text-text-2">Réf. VLT-2026-004127</p>
          </Glass>
        </Ligne>

        <Ligne titre="Bulle" detail="Message du bot. Réf. 02 (chat)." image="bulle" largeur={278}>
          <Glass forme="bulle" className="w-[262px] px-4 py-3">
            <span className="flex items-center gap-2 text-legende text-text-2">
              <img src="/marque/vault-goutte@2x.png" alt="" className="h-5 w-auto" />
              VAULT
            </span>
            <p className="mt-2 text-corps">Bonjour. Décrivez votre situation en quelques phrases.</p>
          </Glass>
        </Ligne>

        <Ligne titre="Pastille" detail="Icône ronde. Réf. 07 (compte)." image="pastille" largeur={148}>
          <span className="flex items-center gap-3 text-bloc">
            <Glass forme="pastille" className="size-12">
              <TrayIcon size={22} aria-hidden="true" />
            </Glass>
            Reçue
          </span>
        </Ligne>

        <Ligne titre="Chips" detail="Suggestions. Réf. 02." image="chips" largeur={484}>
          <div className="flex flex-wrap justify-center gap-2">
            {['Ma carte est refusée', 'Un virement manque', 'Je conteste'].map((t) => (
              <Glass key={t} as="button" type="button" forme="pilule" interactif className="h-10 px-4 text-libelle">
                {t}
              </Glass>
            ))}
          </div>
        </Ligne>

        <Ligne titre="Champ" detail="Saisie et envoi. Réf. 02." image="champ" largeur={332}>
          <div className="flex w-[320px] items-center gap-2">
            <Glass forme="pilule" className="flex h-12 flex-1 items-center px-5 text-libelle text-text-2">
              Votre message
            </Glass>
            <Glass as="button" type="button" forme="pastille" interactif ton="accent" aria-label="Envoyer" className="size-12">
              <ArrowUpIcon size={20} aria-hidden="true" />
            </Glass>
          </div>
        </Ligne>

        <Ligne titre="Tube et bille" detail="Le rail du délai. Réf. 01 (Daily Limit)." image="tube" largeur={328}>
          <div className="w-[312px]">
            <TubeDelai progression={0.55} repere={{ position: 0.244, plein: true }} libelle="Délai écoulé : 55 %" />
          </div>
        </Ligne>

        <Ligne titre="Capsules empilées" detail="Les étapes. Réf. 03 (notifications)." image="capsules" largeur={458}>
          <div className="flex w-[380px] max-w-full flex-col gap-2">
            <Etape icone={<CheckCircleIcon size={20} />} titre="Accusé de réception envoyé" detail="le lundi 9 novembre 2026" />
            <Etape icone={<ClockIcon size={20} />} titre="Échéance dans 2 jours ouvrés" />
            <Etape icone={<HourglassIcon size={20} />} titre="En cours d’examen" />
          </div>
        </Ligne>
      </div>
    </div>
  )
}
