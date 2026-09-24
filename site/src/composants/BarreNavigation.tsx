import { CaretLeftIcon } from '@phosphor-icons/react'
import { Glass } from './Glass'
import { Logo } from './Logo'

/** En-tête : retour dans une pastille de verre, logo au centre, aucune barre visible. */
export function BarreNavigation() {
  return (
    <header className="barre sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
      <div className="relative flex h-16 items-center justify-center px-5">
        <Glass
          as="button"
          type="button"
          forme="pastille"
          interactif
          aria-label="Retour"
          onClick={() => history.back()}
          className="absolute left-5 size-11 text-text"
        >
          <CaretLeftIcon size={20} aria-hidden="true" />
        </Glass>
        <Logo />
      </div>
    </header>
  )
}
