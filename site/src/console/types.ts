// Forme des lots renvoyés par l'API (api/lots.py). Les codes (billing, card, low…)
// sont ceux du schéma du bot (src/schema.py) ; les libellés français sont dans libelles.ts.

export type Colonne = 'categorie' | 'produit' | 'severite'
export type StatutLot = 'en_attente' | 'en_cours' | 'termine' | 'erreur' | 'arrete'

export interface Apercu {
  nom: string
  tickets: number
  colonnes: string[]
  /** Colonnes de bonnes réponses présentes dans le CSV. */
  bonnes_reponses: Colonne[]
  estimation_s: number
}

export interface LotResume {
  id: string
  nom: string
  /** Déjà rédigé par l'API : « 24/09 à 14:10 ». */
  cree_le: string
  statut: StatutLot
  tickets: number
  fait: number
  total: number
}

export interface Prediction {
  categorie_predite: string
  produit_predit: string
  severite_predite: string
  sous_motif: string
  reclamation: 'oui' | 'non'
  injection_suspectee: 'oui' | 'non'
  /** Connus à la fin du lot seulement (après le contrôle). */
  echeance?: string
  echeance_texte?: string | null
  /** « 21/10 » */
  echeance_court?: string | null
  controle?: string
}

export interface Ligne {
  n: number
  id: string
  ticket: string
  attendu: Partial<Record<Colonne, string>>
  /** null tant que le tri de ce ticket n'est pas fait. */
  prediction: Prediction | null
}

export interface MetriqueChamp {
  n: number
  correct: number
  labels: string[]
  /** Lignes : bonne réponse ; colonnes : prédiction. */
  matrix: Record<string, Record<string, number>>
}

export interface Metriques {
  fields: Partial<Record<Colonne, MetriqueChamp>>
  exact: { n: number; correct: number; over: Colonne[] }
}

export interface Analyse {
  tickets: number
  reclamations: number
  suspects: number
  repartitions: Record<Colonne, Record<string, number>> & {
    produit_x_severite: Record<string, Record<string, number>>
  }
  metriques: Metriques | null
}

export interface Lot extends LotResume {
  etape: string | null
  reste_s: number | null
  secondes: number | null
  erreur: string | null
  etapes: string[]
  lignes: Ligne[]
  analyse: Analyse
}
