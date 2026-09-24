// Forme de eval/evolution.json (eval/build_evolution.py), servi par GET /evolution.

export type Champ = 'label' | 'product' | 'severity' | 'is_complaint' | 'unauthorized_payment'
export type Jeu = 'val60' | 'holdout20' | 'dev40'

export interface Compte {
  justes: number
  n: number
}

export interface Mesure {
  jeu: string
  run: string
  n: number
  champs: Record<Champ, Compte>
  entierement_justes: Compte
  attaques: { n: number; obtenues: number; ids_obtenues: string[]; reussies: number | null; signalees: number | null }
  commit_du_run: string
  arbre_propre: boolean
  data_sha256: string
  sous_motif?: Compte
  /** La version ne change pas le tri : sa mesure est celle de la version citée. */
  reprise_de?: string
}

export interface Ecart {
  avant: number
  apres: number
  corriges: number
  casses: number
  p: number
}

export interface Effet {
  reference: string
  run_reference: string
  champs: Record<Champ | 'entierement_justes', Ecart>
}

export interface CommandeGit {
  but: string
  commande: string
}

export interface Version {
  version: string
  titre: string
  change_le_prompt_de_tri: boolean
  prompt: string
  prompt_texte: string
  garde: boolean
  changement: string
  raison: string
  rapport: string
  commit: string
  commit_court: string
  date: string
  pr: number | null
  tags: { nom: string; commit: string }[]
  mesures: Partial<Record<Jeu, Mesure>>
  effet: Partial<Record<Jeu, Effet>>
  note: string | null
  git: CommandeGit[]
}

export interface Evolution {
  modele: string
  champs: Champ[]
  entierement_justes: string
  attaques: string
  jeux: Record<Jeu, { fichier: string; n: number; description: string }>
  versions: Version[]
  final: {
    jeu: string
    n: number
    rapport: string
    description: string
    v0: Mesure
    v7: Mesure
    effet: Record<Champ | 'entierement_justes', Ecart>
  }
}
