import type { Ressource } from '../api'
import type { Compte, Operations as DonneesOperations } from '../donnees/types'
import { BandeauDemo, BarreHaut } from '../composants/BarreHaut'
import { Carte } from '../composants/Carte'
import { Chat } from '../composants/Chat'
import { CarteSquelette, ErreurBloc, MoisSquelette, OperationsSquelette, SoldeSquelette } from '../composants/Etats'
import { BarreLaterale, NavigationBas } from '../composants/Navigation'
import { Operations } from '../composants/Operations'
import { ResumeMois } from '../composants/ResumeMois'
import { Solde } from '../composants/Solde'

interface Props {
  compte: Ressource<Compte>
  operations: Ressource<DonneesOperations>
  rechargerCompte: () => void
  rechargerOperations: () => void
}

/**
 * Accueil client (DESIGN.md 6.1), sur les données de l'API. Desktop : barre
 * latérale, solde et opérations à gauche, carte et mois à droite. Mobile : une
 * colonne, la navigation en bas. Chaque bloc a ses états (DESIGN.md 7) : une
 * erreur reste dans son bloc.
 */
export function Accueil({ compte, operations, rechargerCompte, rechargerOperations }: Props) {
  const c = compte.etat === 'pret' ? compte.donnees : undefined
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <BarreLaterale client={c?.client} />
      <div className="min-w-0">
        <BandeauDemo />
        <BarreHaut titre="Accueil" initiales={c?.client.initiales} />
        <main className="mx-auto max-w-[1120px] px-5 pt-8 pb-36 lg:px-10 lg:pt-14 lg:pb-20">
          <h1 className="sr-only">Accueil</h1>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12 lg:gap-y-10">
            <div className="lg:col-start-1 lg:row-start-1">
              {compte.etat === 'chargement' && <SoldeSquelette />}
              {compte.etat === 'erreur' && <ErreurBloc onReessayer={rechargerCompte} />}
              {c && <Solde compte={c.compte} />}
            </div>
            {/* En erreur, le compte n'a qu'un bloc (celui du solde) : pas de case vide à la place de la carte et du mois. */}
            {compte.etat !== 'erreur' && (
              <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                {c ? <Carte carte={c.carte} /> : <CarteSquelette />}
              </div>
            )}
            <div className="lg:col-start-1 lg:row-span-2 lg:row-start-2">
              {operations.etat === 'chargement' && <OperationsSquelette />}
              {operations.etat === 'erreur' && <ErreurBloc onReessayer={rechargerOperations} />}
              {operations.etat === 'pret' && <Operations jours={operations.donnees.jours} />}
            </div>
            {compte.etat !== 'erreur' && (
              <div className="lg:col-start-2 lg:row-start-3 lg:self-start">
                {c ? <ResumeMois mois={c.mois} /> : <MoisSquelette />}
              </div>
            )}
          </div>
        </main>
      </div>
      <NavigationBas />
      <Chat />
    </div>
  )
}
