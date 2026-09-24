import { useEffect, useState } from 'react'
import type { Compte, Operations, SuiviTicket, TicketCree } from './donnees/types'

// Client de l'API VAULT (api/main.py). En local : make demo lance l'API sur le port 8000.
export const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

/** Même limite que l'API (api/main.py : LONGUEUR_MAX). */
export const LONGUEUR_MAX = 2000

async function lire<T>(chemin: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + chemin, init)
  if (!r.ok) throw new Error(`${chemin} : HTTP ${r.status}`)
  return (await r.json()) as T
}

export const chargerCompte = (signal?: AbortSignal) => lire<Compte>('/compte', { signal })
export const chargerOperations = (signal?: AbortSignal) => lire<Operations>('/operations', { signal })

export const envoyerMessage = (message: string) =>
  lire<TicketCree>('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

export const suivreTicket = (reference: string) => lire<SuiviTicket>(`/tickets/${encodeURIComponent(reference)}`)

const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Interroge le suivi jusqu'au message fixe de l'API. Si le suivi ne répond plus
 * ou si le tri dure trop, on garde le message de base renvoyé à la création :
 * le ticket existe de toute façon.
 */
export async function attendreMessage(
  ticket: TicketCree,
  { suivre = suivreTicket, intervalle = 1500, essais = 400, echecsMax = 5 } = {},
): Promise<string> {
  let echecs = 0
  for (let i = 0; i < essais; i++) {
    try {
      const t = await suivre(ticket.reference)
      if (t.message_client) return t.message_client
      echecs = 0
    } catch {
      if (++echecs >= echecsMax) break
    }
    await attendre(intervalle)
  }
  return ticket.message_client
}

export type Ressource<T> = { etat: 'chargement' } | { etat: 'erreur' } | { etat: 'pret'; donnees: T }

/** Charge une ressource de l'API, avec « Réessayer » en cas d'erreur (DESIGN.md 7). */
export function useRessource<T>(charger: (signal: AbortSignal) => Promise<T>): [Ressource<T>, () => void] {
  const [ressource, setRessource] = useState<Ressource<T>>({ etat: 'chargement' })
  const [essai, setEssai] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    charger(controle.signal).then(
      (donnees) => setRessource({ etat: 'pret', donnees }),
      () => {
        if (!controle.signal.aborted) setRessource({ etat: 'erreur' })
      },
    )
    return () => controle.abort()
  }, [charger, essai])

  const recharger = () => {
    setRessource({ etat: 'chargement' })
    setEssai((n) => n + 1)
  }
  return [ressource, recharger]
}
