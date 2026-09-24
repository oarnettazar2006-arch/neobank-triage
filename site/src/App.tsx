import { chargerCompte, chargerOperations, useRessource } from './api'
import { Console } from './console/Console'
import { Accueil } from './ecrans/Accueil'

/** Deux surfaces : l'espace client (/) et la console conseiller (/console, /console/brouillons, /console/prompts). */
export function App() {
  const chemin = window.location.pathname.replace(/\/+$/, '')
  if (chemin === '/console') return <Console />
  if (chemin === '/console/prompts') return <Console onglet="prompts" />
  if (chemin === '/console/brouillons') return <Console onglet="brouillons" />
  return <EspaceClient />
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
