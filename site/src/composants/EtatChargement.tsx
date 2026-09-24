/** Squelettes statiques, à la forme exacte du contenu (DESIGN.md 7). Aucun scintillement. */
export function EtatChargement() {
  const bloc = 'bg-[rgb(var(--text-rgb)/0.06)]'
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Chargement de votre demande…
      </p>
      <div aria-hidden="true">
        <div className={`mt-2 h-[18px] w-4/5 rounded-full ${bloc}`} />
        <div className={`mt-8 rounded-signature p-6 ${bloc}`}>
          <div className={`h-5 w-1/2 rounded-full ${bloc}`} />
          <div className={`mt-2 h-8 w-2/5 rounded-full ${bloc}`} />
          <div className={`mt-2 h-8 w-11/12 rounded-full ${bloc}`} />
          <div className={`mt-8 h-1 w-full rounded-full ${bloc}`} />
          <div className={`mt-6 h-5 w-2/3 rounded-full ${bloc}`} />
        </div>
        <div className={`mt-8 h-[26px] w-1/2 rounded-full ${bloc}`} />
        <div className={`mt-3 h-24 rounded-glass ${bloc}`} />
      </div>
    </div>
  )
}
