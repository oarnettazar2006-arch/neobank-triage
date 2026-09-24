import type { ComponentPropsWithoutRef } from 'react'

/** Bouton secondaire client (DESIGN.md 5.1) : capsule de 44 px, filet --line-strong. */
export function BoutonSecondaire({ className = '', ...props }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      className={`bouton-secondaire inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-line-strong bg-transparent px-5 text-libelle font-medium text-text ${className}`}
      {...props}
    />
  )
}
