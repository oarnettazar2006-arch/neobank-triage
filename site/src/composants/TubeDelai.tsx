import type { CSSProperties } from 'react'
import { Glass } from './Glass'

const p = (v: number) => ({ '--p': Math.min(Math.max(v, 0), 1) }) as CSSProperties

/**
 * Le rail du délai : un tube de verre dans lequel roule une bille (réf. 01,
 * « Daily Limit »). `progression` et `repere.position` viennent de l'API.
 */
export function TubeDelai({
  progression,
  repere,
  libelle,
}: {
  progression: number
  repere?: { position: number; plein: boolean }
  libelle: string
}) {
  return (
    <Glass forme="tube" className="tube" role="img" aria-label={libelle}>
      <div className="tube-zone">
        <div className="tube-canal" />
        {progression > 0 && <div className="tube-cap" />}
        <div className="tube-rempli" style={p(progression)} />
        {repere && (
          <div className="tube-repere" style={p(repere.position)}>
            <span className="tube-anneau" data-plein={repere.plein || undefined} />
          </div>
        )}
        <div className="tube-repere" data-bille style={p(progression)}>
          <Glass forme="bille" className="tube-bille" />
        </div>
      </div>
    </Glass>
  )
}
