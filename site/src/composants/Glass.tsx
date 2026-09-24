import type { ComponentPropsWithoutRef, ElementType } from 'react'
import './glass.css'

export type FormeGlass = 'pilule' | 'carte' | 'bulle' | 'pastille' | 'tube' | 'bille'

type Props<T extends ElementType> = {
  as?: T
  forme?: FormeGlass
  /** « accent » pour l'action principale d'un écran (une seule). */
  ton?: 'accent'
  /** Élément cliquable : fondu d'état au survol et à l'appui. */
  interactif?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Verre liquide du client (DESIGN.md 4). Toute la matière est dans glass.css ;
 * ce composant ne choisit que la forme et le ton.
 */
export function Glass<T extends ElementType = 'div'>({
  as,
  forme = 'carte',
  ton,
  interactif = false,
  className = '',
  ...props
}: Props<T>) {
  const Balise: ElementType = as ?? 'div'
  return (
    <Balise
      className={`glass glass-${forme} ${interactif ? 'glass-interactif' : ''} ${className}`}
      data-ton={ton}
      {...props}
    />
  )
}
