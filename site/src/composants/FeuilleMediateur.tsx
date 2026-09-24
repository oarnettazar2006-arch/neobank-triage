import { useEffect, useRef } from 'react'
import type { Mediateur } from '../api/contrat'
import { BoutonSecondaire } from './BoutonSecondaire'

/**
 * Feuille « Saisir le médiateur » (DESIGN.md 7) : opaque, sans animation, voile
 * à 48 %. Rien n'est envoyé : le client saisit le médiateur lui-même.
 */
export function FeuilleMediateur({
  ouverte,
  mediateur,
  reference,
  onFermer,
}: {
  ouverte: boolean
  mediateur: Mediateur
  reference: string
  onFermer: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouverte && !d.open) d.showModal()
    if (!ouverte && d.open) d.close()
  }, [ouverte])

  return (
    <dialog
      ref={ref}
      aria-labelledby="feuille-titre"
      className="feuille m-0 mx-auto mt-auto w-full max-w-[560px] max-h-[calc(100dvh-48px)] rounded-t-glass border border-b-0 border-[var(--surface-bord)] bg-surface shadow-[inset_0_1px_0_var(--surface-reflet)] p-6 pb-[max(24px,env(safe-area-inset-bottom))] text-text"
      onClose={onFermer}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer()
      }}
    >
      <h2 id="feuille-titre" className="text-bloc font-semibold">
        Saisir le médiateur
      </h2>
      <p className="mt-3 text-corps text-text-2">
        Le médiateur examine gratuitement votre litige avec VAULT, de façon indépendante. Vous pouvez le saisir
        parce que le délai de réponse est dépassé.
      </p>
      <address className="mt-5 rounded-control border border-line p-4 text-corps not-italic">
        <span className="block font-semibold">{mediateur.nom}</span>
        <span className="mt-1 block text-text-2">{mediateur.adresse}</span>
        <span className="block text-text-2">{mediateur.site}</span>
      </address>
      <p className="mt-5 text-corps">
        Indiquez la référence de votre demande : <span className="chiffres font-semibold">{reference}</span>
      </p>
      <BoutonSecondaire className="mt-6 w-full" onClick={onFermer} autoFocus>
        Fermer
      </BoutonSecondaire>
    </dialog>
  )
}
