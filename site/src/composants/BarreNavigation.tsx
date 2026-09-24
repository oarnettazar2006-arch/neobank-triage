import { CaretLeftIcon } from '@phosphor-icons/react'
import { SurfaceVerre } from './SurfaceVerre'

/** Barre du haut, en verre : retour à gauche, mot « VAULT » au centre (logo SVG à venir). */
export function BarreNavigation() {
  return (
    <SurfaceVerre
      as="header"
      className="sticky top-0 z-10 rounded-none border-x-0 border-t-0 pt-[env(safe-area-inset-top)]"
    >
      <div className="relative mx-auto flex h-14 max-w-[560px] items-center justify-center px-2">
        <button
          type="button"
          aria-label="Retour"
          onClick={() => history.back()}
          className="bouton-secondaire absolute left-2 grid size-11 place-items-center rounded-pill border-0 text-text"
        >
          <CaretLeftIcon size={20} aria-hidden="true" />
        </button>
        <span className="text-[1.0625rem] leading-6 font-bold tracking-[0.02em] text-text">VAULT</span>
      </div>
    </SurfaceVerre>
  )
}
