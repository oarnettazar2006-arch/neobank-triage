// Contrat de l'API de suivi (DESIGN.md, section 10). Le front affiche ces champs
// tels quels : il ne calcule ni date, ni progression, ni jours ouvrés.

/** Une date déjà mise en forme par l'API (`src/deadlines.py`). */
export interface DateApi {
  iso: string // "2026-11-02"
  texte: string // "lundi 2 novembre 2026"
  court: string // "2 nov."
}

export interface Echeance extends DateApi {
  kind: 'accuse_reception' | 'reponse'
  atteinte: boolean
  /** Place du repère sur le rail, de 0 (réception) à 1 (échéance de réponse). */
  position: number
  /** Date d'envoi réelle (accusé de réception) ; `null` tant que l'API ne l'a pas. */
  envoye_le: DateApi | null
}

export interface Mediateur {
  nom: string
  adresse: string
  site: string
}

export type Cas = 'reclamation' | 'operation_non_autorisee' | 'signalement' | 'question'
export type Statut = 'recue' | 'en_cours' | 'reponse_envoyee'
/** Seuil « proche » (2 jours ouvrés) appliqué par l'API. */
export type Delai = 'normal' | 'proche' | 'depasse'

export interface TicketSuivi {
  reference: string
  cas: Cas
  statut: Statut
  recu_le: DateApi
  echeances: Echeance[]
  /** Jours ouvrés écoulés / jours ouvrés totaux, entre 0 et 1. */
  progression: number
  jours_ouvres_restants: number
  delai: Delai
  reponse_envoyee_le: DateApi | null
  /** Présent seulement si `delai` vaut `depasse`. */
  mediateur: Mediateur | null
}
