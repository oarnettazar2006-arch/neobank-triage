import type { ReactNode } from 'react'

/** L'écran mobile. En desktop, il est posé au centre du dégradé ardoise (DESIGN.md 4.3). */
export function Ecran({ children }: { children: ReactNode }) {
  return (
    <div className="cadre">
      <div className="ecran">{children}</div>
    </div>
  )
}
