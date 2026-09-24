import { WarningCircleIcon } from '@phosphor-icons/react'

/** Erreur dans le bloc concerné ; les autres blocs restent affichés (DESIGN.md 7). */
export function ErreurBloc({ onReessayer, className = '' }: { onReessayer: () => void; className?: string }) {
  return (
    <div role="alert" className={`bloc flex flex-col items-center gap-3 px-5 py-8 text-center ${className}`}>
      <WarningCircleIcon size={24} className="text-danger" aria-hidden="true" />
      <p className="text-corps text-text">Le service ne répond pas. Réessayez dans un instant.</p>
      <button
        type="button"
        onClick={onReessayer}
        className="pressable h-9 rounded-full border border-line bg-surface px-4 text-petit font-medium text-text hover:bg-surface-2"
      >
        Réessayer
      </button>
    </div>
  )
}

/** Bloc de squelette statique, sans scintillement (DESIGN.md 7 et 8). */
export function Os({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rounded-full bg-surface-2 ${className}`} />
}

export function SoldeSquelette() {
  return (
    <div aria-busy="true" aria-label="Chargement du compte">
      <Os className="h-5 w-32" />
      <Os className="mt-3 h-11 w-56 rounded-[12px] lg:h-14" />
      <Os className="mt-3 h-4 w-40" />
      <div className="mt-7 grid grid-cols-3 gap-2 lg:flex lg:gap-3">
        <Os className="mx-auto size-12 lg:mx-0 lg:h-11 lg:w-32" />
        <Os className="mx-auto size-12 lg:mx-0 lg:h-11 lg:w-48" />
        <Os className="mx-auto size-12 lg:mx-0 lg:h-11 lg:w-28" />
      </div>
    </div>
  )
}

export function CarteSquelette() {
  return (
    <div aria-hidden="true">
      <div className="bloc flex items-center gap-4 p-4 lg:hidden">
        <Os className="h-10 w-16 rounded-[6px]" />
        <span className="flex-1">
          <Os className="h-4 w-28" />
          <Os className="mt-2 h-3 w-20" />
        </span>
      </div>
      <Os className="hidden aspect-[1.586] w-full max-w-[360px] rounded-[18px] lg:block" />
    </div>
  )
}

export function OperationsSquelette() {
  return (
    <section aria-busy="true" aria-label="Chargement des opérations" className="bloc px-5 pt-5 pb-3 lg:px-6">
      <Os className="h-6 w-28" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Os className="size-10 shrink-0" />
          <span className="flex-1">
            <Os className="h-4 w-40" />
            <Os className="mt-2 h-3 w-24" />
          </span>
          <Os className="h-4 w-16" />
        </div>
      ))}
    </section>
  )
}

export function MoisSquelette() {
  return (
    <div aria-hidden="true" className="bloc p-5 lg:p-6">
      <Os className="h-6 w-28" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Os className="h-8 w-28 rounded-[10px]" />
        <Os className="h-8 w-24 rounded-[10px]" />
      </div>
      <Os className="mt-6 h-3 w-32" />
      <Os className="mt-3 h-8 w-full" />
    </div>
  )
}
