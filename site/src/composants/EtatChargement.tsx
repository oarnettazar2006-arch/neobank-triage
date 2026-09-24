import { Glass } from './Glass'

/**
 * Squelettes statiques, à la forme exacte du contenu (DESIGN.md 7). Aucun
 * scintillement. Les formes de verre sont déjà là : rien ne saute à l'arrivée.
 */
export function EtatChargement() {
  const bloc = 'bg-[rgb(var(--text-rgb)/0.07)]'
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Chargement de votre demande…
      </p>
      <div aria-hidden="true">
        <div className={`mt-2 h-4 w-4/5 rounded-full ${bloc}`} />
        <div className={`mt-1 h-4 w-2/5 rounded-full ${bloc}`} />
        <Glass forme="pilule" className="mt-8 flex h-[152px] flex-col items-center justify-center gap-2">
          <div className={`h-4 w-2/5 rounded-full ${bloc}`} />
          <div className={`h-8 w-1/3 rounded-full ${bloc}`} />
          <div className={`h-8 w-3/5 rounded-full ${bloc}`} />
        </Glass>
        <Glass forme="tube" className="mt-12 h-12" />
        <div className={`mt-10 h-6 w-1/4 rounded-full ${bloc}`} />
        <div className="mt-3 space-y-2">
          <Glass forme="pilule" className="h-[60px]" />
          <Glass forme="pilule" className="h-[60px]" />
        </div>
      </div>
    </div>
  )
}
