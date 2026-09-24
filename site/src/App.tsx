import { EcranSuivi } from './ecrans/EcranSuivi'

const REFERENCE_PAR_DEFAUT = 'VLT-2026-004127'

/** Une seule route pour le pilote : /suivi/:reference. */
export function App() {
  const correspondance = /^\/suivi\/([^/]+)\/?$/.exec(location.pathname)
  const reference = correspondance?.[1] ? decodeURIComponent(correspondance[1]) : null
  if (!reference) {
    history.replaceState(null, '', `/suivi/${REFERENCE_PAR_DEFAUT}`)
    return <EcranSuivi reference={REFERENCE_PAR_DEFAUT} />
  }
  return <EcranSuivi key={reference} reference={reference} />
}
