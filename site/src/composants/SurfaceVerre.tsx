import type { ComponentPropsWithoutRef, ElementType } from 'react'

type Props<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>

/**
 * Surface de verre (DESIGN.md 4.3). Les trois replis opaques (transparence
 * réduite, navigateur sans backdrop-filter, contraste élevé) sont dans index.css.
 * Trois usages seulement : navigation, bulles du bot, carte de suivi.
 */
export function SurfaceVerre<T extends ElementType = 'div'>({ as, className = '', ...props }: Props<T>) {
  const Balise = as ?? 'div'
  return <Balise className={`verre ${className}`} {...props} />
}
