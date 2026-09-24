import { WarningCircleIcon } from '@phosphor-icons/react'
import { Glass } from './Glass'

/** Erreur : le message sur une surface calme, l'action en pilule de verre (DESIGN.md 7). */
export function EtatErreur({ onReessayer }: { onReessayer: () => void }) {
  return (
    <div role="alert" className="surface mt-8 rounded-[24px] p-5">
      <div className="flex gap-3">
        <WarningCircleIcon size={20} weight="regular" className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <p className="text-corps text-text">Le service ne répond pas. Réessayez dans un instant.</p>
      </div>
      <Glass as="button" type="button" forme="pilule" interactif className="mt-4 ml-8 h-12 px-6 text-libelle font-medium" onClick={onReessayer}>
        Réessayer
      </Glass>
    </div>
  )
}
