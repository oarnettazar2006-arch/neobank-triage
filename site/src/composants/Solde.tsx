import { ArrowsLeftRightIcon, CreditCardIcon, PlusIcon } from '@phosphor-icons/react'
import type { Accueil } from '../donnees/types'
import { decouperSolde } from '../format'

const ACTIONS = [
  { libelle: 'Virement', court: 'Virement', icone: ArrowsLeftRightIcon, principal: false },
  { libelle: 'Ajouter de l’argent', court: 'Ajouter', icone: PlusIcon, principal: true },
  { libelle: 'Carte', court: 'Carte', icone: CreditCardIcon, principal: false },
] as const

/** Le solde en grand, puis les trois actions rapides. */
export function Solde({ compte }: { compte: Accueil['compte'] }) {
  const { entier, decimales } = decouperSolde(compte.solde)
  return (
    <section aria-labelledby="solde-titre">
      <h2 id="solde-titre" className="text-corps font-medium text-text-2">
        {compte.nom}
      </h2>
      <p className="montant mt-2 text-[2.75rem] leading-none font-semibold tracking-[-0.035em] text-text lg:text-solde">
        {entier}
        <span className="text-[0.55em] tracking-[-0.02em] text-text-2">{decimales}</span>
      </p>
      <p className="montant mt-3 text-petit text-text-2">{compte.iban_masque}</p>

      {/* Mobile : boutons ronds et libellés dessous. Desktop : pilules. */}
      <ul className="mt-7 grid grid-cols-3 gap-2 lg:flex lg:gap-3">
        {ACTIONS.map(({ libelle, court, icone: Icone, principal }) => (
          <li key={libelle}>
            <button
              type="button"
              aria-label={libelle}
              className={`pressable group flex w-full flex-col items-center gap-2 lg:h-11 lg:w-auto lg:flex-row lg:gap-2 lg:rounded-full lg:px-5 ${
                principal
                  ? 'lg:bg-accent lg:text-on-accent'
                  : 'lg:border lg:border-line lg:bg-surface lg:text-text lg:hover:bg-surface-2'
              }`}
            >
              <span
                className={`grid size-12 place-items-center rounded-full lg:size-auto lg:bg-transparent ${
                  principal
                    ? 'bg-accent text-on-accent lg:text-on-accent'
                    : 'bg-[rgb(var(--accent-rgb)/0.1)] text-accent'
                }`}
              >
                <Icone size={20} weight="bold" aria-hidden="true" />
              </span>
              <span aria-hidden="true" className="text-petit font-medium text-text lg:hidden">
                {court}
              </span>
              <span aria-hidden="true" className="hidden text-corps font-medium lg:inline">
                {libelle}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
