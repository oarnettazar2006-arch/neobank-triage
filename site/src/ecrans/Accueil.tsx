import type { Accueil as DonneesAccueil } from '../donnees/types'
import { BandeauDemo, BarreHaut } from '../composants/BarreHaut'
import { Carte } from '../composants/Carte'
import { Chat } from '../composants/Chat'
import { BarreLaterale, NavigationBas } from '../composants/Navigation'
import { Operations } from '../composants/Operations'
import { ResumeMois } from '../composants/ResumeMois'
import { Solde } from '../composants/Solde'

/**
 * Accueil client (DESIGN.md 6.1). Desktop : barre latérale, solde et
 * opérations à gauche, carte et mois à droite. Mobile : une colonne, la
 * navigation en bas.
 */
export function Accueil({ donnees }: { donnees: DonneesAccueil }) {
  const { client, compte, carte, mois, jours } = donnees
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <BarreLaterale client={client} />
      <div className="min-w-0">
        <BandeauDemo />
        <BarreHaut titre="Accueil" initiales={client.initiales} />
        <main className="mx-auto max-w-[1120px] px-5 pt-8 pb-36 lg:px-10 lg:pt-14 lg:pb-20">
          <h1 className="sr-only">Accueil</h1>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12 lg:gap-y-10">
            <div className="lg:col-start-1 lg:row-start-1">
              <Solde compte={compte} />
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Carte carte={carte} />
            </div>
            <div className="lg:col-start-1 lg:row-span-2 lg:row-start-2">
              <Operations jours={jours} />
            </div>
            <div className="lg:col-start-2 lg:row-start-3 lg:self-start">
              <ResumeMois mois={mois} />
            </div>
          </div>
        </main>
      </div>
      <NavigationBas />
      <Chat />
    </div>
  )
}
