// Forme des données de l'accueil, telle que l'API la renverra. Les montants sont
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

export interface Accueil {
  client: { prenom: string; nom: string; initiales: string }
  compte: { nom: string; iban_masque: string; solde: number }
  carte: { nom: string; derniers_chiffres: string; titulaire: string; expiration: string; etat: 'active' | 'gelee' }
  mois: {
    libelle: string
    depenses: number
    revenus: number
    categories: { categorie: Categorie; montant: number }[]
  }
  jours: Jour[]
}
