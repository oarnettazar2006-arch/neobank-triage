import type { Colonne } from './types'

// Libellés français des codes du schéma (src/schema.py). Le CSV exporté garde les codes.

export const CHAMP: Record<Colonne, string> = { categorie: 'Catégorie', produit: 'Produit', severite: 'Gravité' }

/** Ordre du schéma : les graphiques gardent toujours cet ordre, jamais un tri par valeur. */
export const VALEURS: Record<Colonne, Record<string, string>> = {
  categorie: { billing: 'Facturation', bug: 'Incident', other: 'Autre' },
  produit: { card: 'Carte', transfer: 'Virement', direct_debit: 'Prélèvement', account: 'Compte', unknown: 'Indéterminé' },
  severite: { low: 'Faible', medium: 'Moyenne', high: 'Haute' },
}

export const PREDIT: Record<Colonne, 'categorie_predite' | 'produit_predit' | 'severite_predite'> = {
  categorie: 'categorie_predite',
  produit: 'produit_predit',
  severite: 'severite_predite',
}

export const COLONNES: Colonne[] = ['categorie', 'produit', 'severite']

export const libelle = (col: Colonne, code: string) => VALEURS[col][code] ?? code
