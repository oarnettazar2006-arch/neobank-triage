import { useCallback, useEffect, useState } from 'react'
import type { TicketSuivi } from '../api/contrat'
import { chargerSuivi } from '../api/suivi'
import { BarreNavigation } from '../composants/BarreNavigation'
import { Ecran } from '../composants/Ecran'
import { EtatChargement } from '../composants/EtatChargement'
import { EtatErreur } from '../composants/EtatErreur'
import { VueSuivi } from '../composants/VueSuivi'

type Etat = { kind: 'chargement' } | { kind: 'erreur' } | { kind: 'charge'; ticket: TicketSuivi }

/** Écran pilote : /suivi/:reference (DESIGN.md 6.3 et 10). */
export function EcranSuivi({ reference }: { reference: string }) {
  const [etat, setEtat] = useState<Etat>({ kind: 'chargement' })
  const [essai, setEssai] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    chargerSuivi(reference, controle.signal).then(
      (ticket) => setEtat({ kind: 'charge', ticket }),
      () => {
        if (!controle.signal.aborted) setEtat({ kind: 'erreur' })
      },
    )
    return () => controle.abort()
  }, [reference, essai])

  const reessayer = useCallback(() => {
    setEtat({ kind: 'chargement' })
    setEssai((n) => n + 1)
  }, [])

  const ticket = etat.kind === 'charge' ? etat.ticket : null

  return (
    <Ecran>
      <BarreNavigation />
      <main className="px-5 pt-4 pb-[max(40px,env(safe-area-inset-bottom))]">
        <h1 className="text-titre font-normal text-text">Votre demande</h1>

        {etat.kind === 'chargement' && <EtatChargement />}
        {etat.kind === 'erreur' && <EtatErreur onReessayer={reessayer} />}

        {ticket && (
          <VueSuivi ticket={ticket} />
        )}
      </main>
    </Ecran>
  )
}
