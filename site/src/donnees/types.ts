// Forme des données renvoyées par l'API (api/main.py). Les montants sont
// en centimes (entiers) ; les dates arrivent déjà rédigées : le front ne calcule
// aucune date (DESIGN.md 10).

export type Categorie =
  | 'Courses'
  | 'Transports'
  | 'Santé'
  | 'Abonnements'
  | 'Restaurants'
  | 'Loisirs'
  | 'Virements'
  | 'Énergie'
  | 'Logement'
  | 'Revenus'

export interface Operation {
  id: string
  libelle: string
  categorie: Categorie
  /** Centimes : négatif pour un débit, positif pour un crédit. */
  montant: number
  /** Complément affiché sous le libellé, facultatif (« Remboursement dîner »). */
  detail?: string
  heure?: string
}

export interface Jour {
  /** Déjà rédigé par l'API : « Aujourd'hui », « Hier », « Mardi 22 septembre ». */
  libelle: string
  operations: Operation[]
}

/** GET /compte */
export interface Compte {
  client: { prenom: string; nom: string; initiales: string }
  compte: { nom: string; iban_masque: string; solde: number }
  carte: { nom: string; derniers_chiffres: string; titulaire: string; expiration: string; etat: 'active' | 'gelee' }
  mois: {
    libelle: string
    depenses: number
    revenus: number
    categories: { categorie: Categorie; montant: number }[]
  }
}

/** GET /operations */
export interface Operations {
  jours: Jour[]
}

/** POST /chat : le ticket est créé tout de suite, le tri tourne ensuite côté API. */
export interface TicketCree {
  reference: string
  statut: string
  /** Message de base, sans dates, à afficher si le suivi ne répond plus. */
  message_client: string
}

/** GET /tickets/{ref} : vue client, jamais de brouillon. */
export interface SuiviTicket {
  reference: string
  statut: string
  traitement: 'en_attente' | 'en_cours' | 'termine' | 'erreur'
  /** Message fixe écrit par l'API ; null tant que le tri n'est pas fini. */
  message_client: string | null
}
