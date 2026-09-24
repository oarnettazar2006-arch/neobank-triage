import { ContactlessPaymentIcon, SnowflakeIcon } from '@phosphor-icons/react'
import type { Accueil } from '../donnees/types'

function Visuel({ carte, compact = false }: { carte: Accueil['carte']; compact?: boolean }) {
  if (compact) {
    return (
      <span
        aria-hidden="true"
        className="relative grid h-10 w-16 shrink-0 place-items-center rounded-[6px] bg-[var(--carte)] shadow-[var(--ombre-1)]"
      >
        <img src="/marque/vault-goutte@2x.png" alt="" className="h-4 w-auto" />
      </span>
    )
  }
  return (
    <div
      role="img"
      aria-label={`${carte.nom} se terminant par ${carte.derniers_chiffres}`}
      className="aspect-[1.586] w-full rounded-[18px] border border-[var(--carte-bord)] bg-[var(--carte)] p-5 text-[var(--carte-texte)] shadow-[var(--ombre-flottante)]"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="flex items-center gap-2">
            <img src="/marque/vault-goutte@2x.png" alt="" className="h-6 w-auto" />
            <span className="text-[0.9375rem] font-semibold tracking-[0.08em]">VAULT</span>
          </span>
          <ContactlessPaymentIcon size={22} className="text-[var(--carte-texte-2)]" aria-hidden="true" />
        </div>
        <div className="flex items-end justify-between">
          <span>
            <span className="block text-petit text-[var(--carte-texte-2)]">{carte.titulaire}</span>
            <span className="montant mt-1 block text-[1.0625rem] font-medium tracking-[0.12em]">
              •••• {carte.derniers_chiffres}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-petit text-[var(--carte-texte-2)]">Débit</span>
            <span className="montant mt-1 block text-petit text-[var(--carte-texte-2)]">{carte.expiration}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Aperçu de la carte VAULT : marine plein, ratio d'une vraie carte (ISO 7810).
 * Desktop : la carte entière. Mobile : une ligne compacte, comme dans une app.
 */
export function Carte({ carte }: { carte: Accueil['carte'] }) {
  const etat = carte.etat === 'active' ? 'Active' : 'Gelée'
  const geler = (
    <button
      type="button"
      className="pressable flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-petit font-medium text-text hover:bg-surface-2"
    >
      <SnowflakeIcon size={16} aria-hidden="true" />
      Geler
    </button>
  )
  return (
    <section aria-labelledby="carte-titre">
      <h2 id="carte-titre" className="sr-only">
        {carte.nom}
      </h2>

      <div className="bloc flex items-center gap-4 p-4 lg:hidden">
        <Visuel carte={carte} compact />
        <span className="min-w-0 flex-1">
          <span className="block text-corps font-medium text-text">{carte.nom}</span>
          <span className="montant block text-petit text-text-2">
            •••• {carte.derniers_chiffres}, {etat.toLowerCase()}
          </span>
        </span>
        {geler}
      </div>

      <div className="hidden max-w-[360px] lg:block">
        <Visuel carte={carte} />
        <div className="mt-4 flex items-center justify-between">
          <span>
            <span className="block text-corps font-medium text-text">{carte.nom}</span>
            <span className="block text-petit text-text-2">{etat}</span>
          </span>
          {geler}
        </div>
      </div>
    </section>
  )
}
