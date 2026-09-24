import type { Cas, Statut, TicketSuivi } from './api/contrat'

// Textes du client (DESIGN.md, sections 7, 9 et 10).

export const LIBELLE_CAS: Record<Cas, string> = {
  reclamation: 'Réclamation',
  operation_non_autorisee: 'Opération non autorisée',
  signalement: 'Signalement',
  question: 'Question',
}

export const LIBELLE_STATUT: Record<Statut, string> = {
  recue: 'Reçue',
  en_cours: 'En cours d’examen',
  reponse_envoyee: 'Réponse envoyée',
}

/** « votre réclamation » ou « votre demande », dans les phrases. */
export function votreDemande(cas: Cas): string {
  return cas === 'reclamation' ? 'votre réclamation' : 'votre demande'
}

export function joursOuvresRestants(n: number): string {
  if (n <= 0) return 'Échéance aujourd’hui'
  if (n === 1) return 'Échéance dans 1 jour ouvré'
  return `Échéance dans ${n} jours ouvrés`
}

export function ceQuiVaSePasser(t: TicketSuivi): string {
  const demande = votreDemande(t.cas)
  if (t.statut === 'reponse_envoyee') {
    return 'Notre réponse vous a été envoyée par écrit. Si votre situation n’est pas réglée, écrivez-nous.'
  }
  if (t.delai === 'depasse') {
    return `Un conseiller examine ${demande}. Vous recevrez sa réponse par écrit.`
  }
  if (t.statut === 'recue') {
    return `${demande[0]!.toUpperCase()}${demande.slice(1)} est enregistrée. Un conseiller va l’examiner et vous répondra au plus tard à la date indiquée.`
  }
  return `Un conseiller examine ${demande} et vous répond au plus tard à la date indiquée.`
}
