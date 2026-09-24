import { chargerCompte, chargerOperations, useRessource } from './api'
import { Accueil } from './ecrans/Accueil'

/** Une seule page pour cette étape : l'accueil client, sur les données de l'API. */
export function App() {
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
