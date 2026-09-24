import { accueil } from './donnees/accueil'
import { Accueil } from './ecrans/Accueil'

/** Une seule page pour cette étape : l'accueil client, sur données fictives. */
export function App() {
  return <Accueil donnees={accueil} />
}
