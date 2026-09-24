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
  /** Lot lancé avec le rédacteur et la garde de sortie (ticket écrit). */
  brouillon?: boolean
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
  /** Lot avec brouillon seulement. */
  fiche?: string
  brouillon?: string
  brouillon_bloque?: 'oui' | 'non'
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

// Trace d'un ticket (GET /lots/{id}/tickets/{n}/trace, api/trace.py) : enregistrée pendant le lot.

export type EtatBloc = 'fait' | 'en_attente' | 'sans_brouillon'

interface BlocBase {
  titre: string
  /** Modèle (« llama3.1:8b ») ou « code (src/guard.py) ». */
  qui: string
  etat: EtatBloc
  secondes: number | null
  message?: string
}

export interface Retrait {
  rule: string
  text: string
}

export interface BlocGardeEntree extends BlocBase {
  cle: 'garde_entree'
  texte_recu?: string
  retires?: Retrait[]
  signal?: boolean
  texte_envoye?: string
}

export interface BlocTri extends BlocBase {
  cle: 'tri'
  prompt?: string
  /** Le texte inséré à la place de {ticket} (texte nettoyé par la garde). */
  ticket_insere?: string
  reponse_brute?: string
  champs?: Record<string, string | boolean>
  injection?: { modele: boolean; garde: boolean }
}

export interface BlocControleur extends BlocBase {
  cle: 'controleur'
  prompt?: string
  ticket_insere?: string
  reponse_brute?: string
  sous_motif?: string
  sous_motif_tri?: string
  accord?: boolean
  garde_fou?: string
  garde_fou_texte?: string
}

export interface AppelRedacteur {
  prompt: string
  reponse_brute: string
  secondes: number
}

export interface BlocRedacteur extends BlocBase {
  cle: 'redacteur'
  faits_envoyes?: Record<string, unknown>
  champs_envoyes?: string[]
  appels?: AppelRedacteur[]
  /** Suite de mots du ticket retrouvée dans un prompt du rédacteur (null : aucune). */
  ticket_dans_prompt?: string | null
  fiche?: string | null
  fiche_raison?: string
  fiche_texte?: string
  langue?: string
  brouillon_modele?: string
}

export interface Verification {
  regle: string
  texte: string
  resultat: 'ok' | 'violation' | 'sans objet'
  trouve: string | null
}

export interface BlocGardeSortie extends BlocBase {
  cle: 'garde_sortie'
  verifications?: Verification[]
  bloque?: boolean
  dates?: string
  dates_texte?: string
  brouillon?: string
}

export interface Echeance {
  kind: string
  etape: string
  due: string
  date_texte: string
  regle: string
  source: string
  avancee: { de: string } | null
}

export interface BlocDelais extends BlocBase {
  cle: 'delais'
  canal?: string
  canal_par_defaut?: boolean
  recu_le?: string
  recu_le_texte?: string
  recu_par_defaut?: boolean
  reclamation?: boolean
  paiement_non_autorise?: boolean
  produit?: string
  echeances?: Echeance[]
  feries?: { date: string; texte: string; nom: string }[]
}

export type Bloc = BlocGardeEntree | BlocTri | BlocControleur | BlocRedacteur | BlocGardeSortie | BlocDelais

export interface Trace {
  lot: string
  n: number
  id: string
  ticket: string
  brouillon: boolean
  /** false : rien d'enregistré (ticket pas encore traité, ou lot d'avant les traces). */
  trace: boolean
  statut_lot: StatutLot
  blocs: Bloc[]
}
