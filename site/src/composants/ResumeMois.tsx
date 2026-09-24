import type { Compte } from '../donnees/types'
import { formaterMontant, formaterOperation } from '../format'
import { ICONE_CATEGORIE } from './icones'

/** Le mois en cours : dépensé, reçu, trois premiers postes. Sans barres de progression. */
export function ResumeMois({ mois }: { mois: Compte['mois'] }) {
  return (
    <section aria-labelledby="mois-titre" className="bloc p-5 lg:p-6">
      <h2 id="mois-titre" className="text-section font-semibold text-text">
        {mois.libelle}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-petit text-text-2">Dépensé</dt>
          <dd className="montant mt-1 text-[1.5rem] leading-8 font-semibold tracking-[-0.02em] text-text">
            {formaterMontant(mois.depenses)}
          </dd>
        </div>
        <div>
          <dt className="text-petit text-text-2">Reçu</dt>
          <dd className="montant mt-1 text-[1.5rem] leading-8 font-semibold tracking-[-0.02em] text-accent">
            {formaterOperation(mois.revenus)}
          </dd>
        </div>
      </dl>
      <h3 className="mt-6 text-petit font-medium text-text-2">Principaux postes</h3>
      <ul className="mt-2 space-y-1">
        {mois.categories.map(({ categorie, montant }) => {
          const Icone = ICONE_CATEGORIE[categorie]
          return (
            <li key={categorie} className="flex items-center gap-3 py-1.5">
              <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-text-2">
                <Icone size={16} aria-hidden="true" />
              </span>
              <span className="flex-1 text-corps text-text">{categorie}</span>
              <span className="montant text-corps font-medium text-text">{formaterMontant(montant)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
