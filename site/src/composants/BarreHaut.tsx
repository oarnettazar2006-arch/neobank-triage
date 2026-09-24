import { BellIcon, InfoIcon, MoonIcon, SunIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Logo } from './Logo'

type Theme = 'light' | 'dark'

function lireTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Bascule clair / sombre, mémorisée dans le navigateur (DESIGN.md 2.3). */
export function BoutonTheme() {
  const [theme, setTheme] = useState<Theme>(() => (typeof document === 'undefined' ? 'light' : lireTheme()))
  const basculer = () => {
    const suivant: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = suivant
    try {
      localStorage.setItem('vault:theme', suivant)
    } catch {
      // stockage indisponible : le choix vaut pour cette page seulement
    }
    setTheme(suivant)
  }
  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
      className="pressable survol grid size-10 place-items-center rounded-full text-text-2"
    >
      {theme === 'dark' ? <SunIcon size={20} aria-hidden="true" /> : <MoonIcon size={20} aria-hidden="true" />}
    </button>
  )
}

/** Bandeau discret : la démo le dit, sans crier. */
export function BandeauDemo() {
  return (
    <p className="flex h-8 items-center justify-center gap-1.5 bg-surface-2 text-petit text-text-2">
      <InfoIcon size={14} aria-hidden="true" />
      Démo, données fictives
    </p>
  )
}

/** Barre du haut, en verre léger (DESIGN.md 4). */
export function BarreHaut({ titre, initiales }: { titre: string; initiales?: string }) {
  return (
    <header className="verre sticky top-0 z-20 border-b border-[var(--verre-bord)]">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 lg:px-10">
        <span className="lg:hidden">
          <Logo />
        </span>
        <span className="hidden text-[1.0625rem] font-semibold text-text lg:block">{titre}</span>
        <div className="flex items-center gap-1">
          <BoutonTheme />
          <button
            type="button"
            aria-label="Notifications"
            className="pressable survol grid size-10 place-items-center rounded-full text-text-2"
          >
            <BellIcon size={20} aria-hidden="true" />
          </button>
          <span
            aria-hidden="true"
            className="ml-1 grid size-8 place-items-center rounded-full bg-surface-2 text-[0.6875rem] font-semibold text-text lg:hidden"
          >
            {initiales}
          </span>
        </div>
      </div>
    </header>
  )
}
