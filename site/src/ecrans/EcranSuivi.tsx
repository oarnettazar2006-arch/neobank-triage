import { useCallback, useEffect, useState } from 'react'
import type { TicketSuivi } from '../api/contrat'
import { chargerSuivi } from '../api/suivi'
import { BarreNavigation } from '../composants/BarreNavigation'
import { BoutonSecondaire } from '../composants/BoutonSecondaire'
import { CarteSuivi } from '../composants/CarteSuivi'
import { EtatChargement } from '../composants/EtatChargement'
import { EtatErreur } from '../composants/EtatErreur'
import { FeuilleMediateur } from '../composants/FeuilleMediateur'
import { FondVivant } from '../composants/FondVivant'
import { LIBELLE_CAS, ceQuiVaSePasser } from '../libelles'

type Etat = { kind: 'chargement' } | { kind: 'erreur' } | { kind: 'charge'; ticket: TicketSuivi }

/** Écran pilote : /suivi/:reference (DESIGN.md 6.3 et 10). */
export function EcranSuivi({ reference }: { reference: string }) {
  const [etat, setEtat] = useState<Etat>({ kind: 'chargement' })
  const [essai, setEssai] = useState(0)
  const [feuille, setFeuille] = useState(false)

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
    <>
      <FondVivant haloCarte />
      <BarreNavigation />
      <main className="mx-auto max-w-[560px] px-5 pt-6 pb-[max(48px,env(safe-area-inset-bottom))]">
        <h1 className="text-titre font-bold text-text">Votre demande</h1>

        {etat.kind === 'chargement' && <EtatChargement />}
        {etat.kind === 'erreur' && <EtatErreur onReessayer={reessayer} />}

        {ticket && (
          <>
            <p className="mt-1 text-legende font-medium text-text-2">
              {LIBELLE_CAS[ticket.cas]} · reçue le {ticket.recu_le.texte}
            </p>

            <div className="mt-8">
              <CarteSuivi ticket={ticket} />
            </div>

            {ticket.delai === 'depasse' && ticket.mediateur && (
              <div className="mt-4 rounded-glass border border-line bg-surface p-5">
                <p className="text-corps text-text">Vous pouvez aussi saisir le médiateur de VAULT. C’est gratuit.</p>
                <BoutonSecondaire className="mt-4" onClick={() => setFeuille(true)}>
                  Saisir le médiateur
                </BoutonSecondaire>
                <FeuilleMediateur
                  ouverte={feuille}
                  mediateur={ticket.mediateur}
                  reference={ticket.reference}
                  onFermer={() => setFeuille(false)}
                />
              </div>
            )}

            <section className="mt-8" aria-labelledby="suite">
              <h2 id="suite" className="text-bloc font-semibold text-text">
                Ce qui va se passer
              </h2>
              <p className="mt-3 rounded-glass border border-line bg-surface p-5 text-corps text-text">
                {ceQuiVaSePasser(ticket)}
              </p>
            </section>

            <BoutonSecondaire className="mt-8">Écrire au support</BoutonSecondaire>
          </>
        )}
      </main>
    </>
  )
}
