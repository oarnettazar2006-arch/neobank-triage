import { describe, expect, it } from 'vitest'
import { attendreMessage } from './api'
import type { SuiviTicket } from './donnees/types'

const ticket = { reference: 'VLT-ABC234', statut: 'Reçue', message_client: 'message de base' }
const suivi = (message_client: string | null): SuiviTicket => ({
  reference: ticket.reference,
  statut: 'Reçue',
  traitement: message_client ? 'termine' : 'en_cours',
  message_client,
})

describe('attendreMessage', () => {
  it('interroge le suivi jusqu’au message fixe de l’API', async () => {
    const reponses = [suivi(null), suivi(null), suivi('message final avec dates')]
    let appels = 0
    const message = await attendreMessage(ticket, { suivre: async () => reponses[appels++]!, intervalle: 0 })
    expect(message).toBe('message final avec dates')
    expect(appels).toBe(3)
  })

  it('garde le message de base si le suivi ne répond plus', async () => {
    const message = await attendreMessage(ticket, {
      suivre: async () => {
        throw new Error('hors ligne')
      },
      intervalle: 0,
    })
    expect(message).toBe('message de base')
  })

  it('garde le message de base si le tri dure trop', async () => {
    const message = await attendreMessage(ticket, { suivre: async () => suivi(null), intervalle: 0, essais: 3 })
    expect(message).toBe('message de base')
  })
})
