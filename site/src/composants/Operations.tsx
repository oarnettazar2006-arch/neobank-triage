import { CaretRightIcon } from '@phosphor-icons/react'
import type { Jour } from '../donnees/types'
import { formaterOperation } from '../format'
import { ICONE_CATEGORIE } from './icones'

/** Dernières opérations, groupées par jour. Pas de filet sous chaque ligne. */
export function Operations({ jours }: { jours: Jour[] }) {
  return (
    <section aria-labelledby="operations-titre" className="bloc">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 lg:px-6">
        <h2 id="operations-titre" className="text-section font-semibold text-text">
          Opérations
        </h2>
        <a href="#" className="pressable flex items-center gap-0.5 text-corps font-medium text-accent">
          Tout voir
          <CaretRightIcon size={14} weight="bold" aria-hidden="true" />
        </a>
      </div>
      <div className="pb-3">
        {jours.map((jour) => (
          <div key={jour.libelle} className="mt-2">
            <h3 className="px-5 py-2 text-petit font-medium text-text-2 lg:px-6">{jour.libelle}</h3>
            <ul>
              {jour.operations.map((op) => {
                const Icone = ICONE_CATEGORIE[op.categorie]
                const credit = op.montant > 0
                return (
                  <li key={op.id}>
                    <a
                      href="#"
                      className="survol flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 lg:px-6"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-text-2">
                        <Icone size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-corps font-medium text-text">{op.libelle}</span>
                        <span className="block truncate text-petit text-text-2">
                          {op.detail ?? op.categorie}
                          {op.heure && <span className="montant"> à {op.heure}</span>}
                        </span>
                      </span>
                      <span className={`montant text-corps font-medium ${credit ? 'text-accent' : 'text-text'}`}>
                        {formaterOperation(op.montant)}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
