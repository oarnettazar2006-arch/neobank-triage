import { WarningCircleIcon } from '@phosphor-icons/react'
import { BoutonSecondaire } from './BoutonSecondaire'

/** Erreur, toujours sur une surface opaque (DESIGN.md 7). */
export function EtatErreur({ onReessayer }: { onReessayer: () => void }) {
  return (
    <div role="alert" className="mt-8 rounded-glass border border-line bg-surface p-5">
      <div className="flex gap-3">
        <WarningCircleIcon size={20} weight="regular" className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <p className="text-corps text-text">Le service ne répond pas. Réessayez dans un instant.</p>
      </div>
      <BoutonSecondaire className="mt-4 ml-8" onClick={onReessayer}>
        Réessayer
      </BoutonSecondaire>
    </div>
  )
}
