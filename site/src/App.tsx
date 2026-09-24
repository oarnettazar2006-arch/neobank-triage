import { EcranSuivi } from './ecrans/EcranSuivi'
import { Specimen } from './ecrans/Specimen'

const REFERENCE_PAR_DEFAUT = 'VLT-2026-004127'

/** Deux routes : /suivi/:reference (l'écran pilote) et /specimen (le verre). */
export function App() {
  if (/^\/specimen\/?$/.test(location.pathname)) return <Specimen />
  const correspondance = /^\/suivi\/([^/]+)\/?$/.exec(location.pathname)
  const reference = correspondance?.[1] ? decodeURIComponent(correspondance[1]) : null
  if (!reference) {
    history.replaceState(null, '', `/suivi/${REFERENCE_PAR_DEFAUT}`)
    return <EcranSuivi reference={REFERENCE_PAR_DEFAUT} />
  }
  return <EcranSuivi key={reference} reference={reference} />
}
