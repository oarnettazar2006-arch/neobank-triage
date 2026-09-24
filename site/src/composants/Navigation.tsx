import { CreditCardIcon, HouseIcon, PaperPlaneTiltIcon, QuestionIcon, WalletIcon } from '@phosphor-icons/react'
import { Logo } from './Logo'

const ENTREES = [
  { libelle: 'Accueil', icone: HouseIcon },
  { libelle: 'Comptes', icone: WalletIcon },
  { libelle: 'Cartes', icone: CreditCardIcon },
  { libelle: 'Paiements', icone: PaperPlaneTiltIcon },
  { libelle: 'Aide', icone: QuestionIcon },
] as const

const ACTIVE = 'Accueil'

/** Desktop : barre latérale pleine (pas de verre). */
export function BarreLaterale({ client }: { client?: { prenom: string; nom: string; initiales: string } }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <nav aria-label="Navigation principale" className="mt-4 flex-1 px-3">
        <ul className="space-y-1">
          {ENTREES.map(({ libelle, icone: Icone }) => {
            const actif = libelle === ACTIVE
            return (
              <li key={libelle}>
                <a
                  href="#"
                  aria-current={actif ? 'page' : undefined}
                  className={`pressable flex h-10 items-center gap-3 rounded-full px-3 text-corps font-medium ${
                    actif ? 'bg-[rgb(var(--accent-rgb)/0.1)] text-accent' : 'survol text-text-2'
                  }`}
                >
                  <Icone size={20} weight={actif ? 'fill' : 'regular'} aria-hidden="true" />
                  {libelle}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="flex items-center gap-3 border-t border-line px-6 py-4">
        <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-petit font-semibold text-text">
          {client?.initiales}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-corps font-medium text-text">
            {client ? `${client.prenom} ${client.nom}` : '\u00a0'}
          </span>
          <span className="block text-petit text-text-2">Compte personnel</span>
        </span>
      </div>
    </aside>
  )
}

/** Mobile : navigation en bas, en verre léger. */
export function NavigationBas() {
  return (
    <nav
      aria-label="Navigation principale"
      className="verre fixed inset-x-0 bottom-0 z-20 border-t border-[var(--verre-bord)] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {ENTREES.map(({ libelle, icone: Icone }) => {
          const actif = libelle === ACTIVE
          return (
            <li key={libelle}>
              <a
                href="#"
                aria-current={actif ? 'page' : undefined}
                className={`pressable flex h-full flex-col items-center justify-center gap-1 text-[0.75rem] leading-none font-medium ${
                  actif ? 'text-accent' : 'text-text-2'
                }`}
              >
                <Icone size={22} weight={actif ? 'fill' : 'regular'} aria-hidden="true" />
                {libelle}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
