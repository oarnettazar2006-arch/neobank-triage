import { BASE } from '../api'
import type { Apercu, Colonne, Decision, FileBrouillons, Lot, LotResume, Retrait, Trace } from './types'

// Lots de la console (api/main.py, section « Console »).

/** Erreur de l'API avec son message (« colonne « ticket » absente »…), à afficher tel quel. */
export class ErreurApi extends Error {}

async function lire<T>(chemin: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + chemin, init)
  if (!r.ok) {
    let detail = `HTTP ${r.status}`
    try {
      const corps = (await r.json()) as { detail?: unknown }
      if (typeof corps.detail === 'string') detail = corps.detail
    } catch {
      // corps illisible : on garde le code HTTP
    }
    throw new ErreurApi(detail)
  }
  return (await r.json()) as T
}

const envoyer = (nom: string, contenu: string, brouillon = false): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nom, contenu, brouillon }),
})

export const apercuLot = (nom: string, contenu: string) => lire<Apercu>('/lots/apercu', envoyer(nom, contenu))
/** `brouillon` : le rédacteur et la garde de sortie tournent aussi (la console le met pour un ticket écrit). */
export const creerLot = (nom: string, contenu: string, brouillon = false) =>
  lire<Apercu & { id: string; brouillon: boolean }>('/lots', envoyer(nom, contenu, brouillon))
export const listerLots = (signal?: AbortSignal) => lire<LotResume[]>('/lots', { signal })
export const chargerLot = (id: string, signal?: AbortSignal) =>
  lire<Lot>(`/lots/${encodeURIComponent(id)}`, { signal })
export const arreterLot = (id: string) => lire<{ id: string }>(`/lots/${encodeURIComponent(id)}/arreter`, { method: 'POST' })
/** Les six étapes du ticket n (à partir de 1), enregistrées pendant le lot : aucun modèle n'est relancé. */
export const chargerTrace = (id: string, n: number, signal?: AbortSignal) =>
  lire<Trace>(`/lots/${encodeURIComponent(id)}/tickets/${n}/trace`, { signal })
/** La trace d'un ticket du chat (référence VLT-…). */
export const chargerTraceChat = (ref: string, signal?: AbortSignal) =>
  lire<Trace>(`/tickets/${encodeURIComponent(ref)}/trace`, { signal })

// Brouillons à valider.

const json = (corps: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corps),
})

export const listerBrouillons = (signal?: AbortSignal) => lire<FileBrouillons>('/brouillons', { signal })
export const verifierBrouillon = (cle: string, texte: string, signal?: AbortSignal) =>
  lire<{ modifie: boolean; alertes: Retrait[] }>(`/brouillons/${encodeURIComponent(cle)}/verifier`, {
    ...json({ texte }),
    signal,
  })
export const deciderBrouillon = (
  cle: string,
  corps: {
    decision: 'valide' | 'rejete'
    texte: string
    motif?: string
    corrections: Partial<Record<Colonne, string>>
    relu: boolean
  },
) => lire<Decision>(`/brouillons/${encodeURIComponent(cle)}/decision`, json(corps))
export const genererBrouillons = (id: string) =>
  lire<{ id: string; tickets: number }>(`/lots/${encodeURIComponent(id)}/brouillons`, { method: 'POST' })
export const urlCorrections = (lot?: string) => `${BASE}/corrections.csv${lot ? `?lot=${encodeURIComponent(lot)}` : ''}`

export const urlExport = (id: string) => `${BASE}/lots/${encodeURIComponent(id)}/export.csv`

/** Un ticket écrit devient un CSV d'une ligne : il suit le même chemin qu'un fichier. */
export function csvUneLigne(texte: string): string {
  return `ticket\r\n"${texte.trim().replace(/"/g, '""')}"\r\n`
}
