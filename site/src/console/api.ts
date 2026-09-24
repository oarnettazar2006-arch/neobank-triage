import { BASE } from '../api'
import type { Apercu, Lot, LotResume } from './types'

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

const envoyer = (nom: string, contenu: string): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nom, contenu }),
})

export const apercuLot = (nom: string, contenu: string) => lire<Apercu>('/lots/apercu', envoyer(nom, contenu))
export const creerLot = (nom: string, contenu: string) =>
  lire<Apercu & { id: string }>('/lots', envoyer(nom, contenu))
export const listerLots = (signal?: AbortSignal) => lire<LotResume[]>('/lots', { signal })
export const chargerLot = (id: string, signal?: AbortSignal) =>
  lire<Lot>(`/lots/${encodeURIComponent(id)}`, { signal })
export const arreterLot = (id: string) => lire<{ id: string }>(`/lots/${encodeURIComponent(id)}/arreter`, { method: 'POST' })
export const urlExport = (id: string) => `${BASE}/lots/${encodeURIComponent(id)}/export.csv`

/** Un ticket écrit devient un CSV d'une ligne : il suit le même chemin qu'un fichier. */
export function csvUneLigne(texte: string): string {
  return `ticket\r\n"${texte.trim().replace(/"/g, '""')}"\r\n`
}
