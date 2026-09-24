import type { TicketSuivi } from './contrat'
import { maquettes } from './maquettes'

// Remplacé par un appel à l'API FastAPI dans une PR à part. D'ici là, deux
// références de démonstration forcent les états de chargement et d'erreur.
export const REF_CHARGEMENT = 'demo-chargement'
export const REF_ERREUR = 'demo-erreur'

const LATENCE_MS = 300

export function chargerSuivi(reference: string, signal: AbortSignal): Promise<TicketSuivi> {
  return new Promise((resolve, reject) => {
    if (reference === REF_CHARGEMENT) return // reste en attente
    const minuterie = setTimeout(() => {
      const ticket = maquettes[reference]
      if (ticket && reference !== REF_ERREUR) resolve(ticket)
      else reject(new Error('service indisponible'))
    }, LATENCE_MS)
    signal.addEventListener('abort', () => clearTimeout(minuterie))
  })
}
