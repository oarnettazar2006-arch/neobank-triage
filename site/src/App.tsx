import { chargerCompte, chargerOperations, useRessource } from './api'
import { Console } from './console/Console'
import { Accueil } from './ecrans/Accueil'

/** Deux surfaces : l'espace client (/) et la console conseiller (/console). */
export function App() {
  return window.location.pathname.replace(/\/+$/, '') === '/console' ? <Console /> : <EspaceClient />
}

function EspaceClient() {
  const [compte, rechargerCompte] = useRessource(chargerCompte)
  const [operations, rechargerOperations] = useRessource(chargerOperations)
  return (
    <Accueil
      compte={compte}
      operations={operations}
      rechargerCompte={rechargerCompte}
      rechargerOperations={rechargerOperations}
    />
  )
}
