// Mise en forme des montants (DESIGN.md 9) : format français, espace fine
// insécable avant l'euro, vrai signe moins, « + » explicite pour un crédit.

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** 231846 → « 2 318,46 € » */
export function formaterMontant(centimes: number): string {
  return euros.format(Math.abs(centimes) / 100)
}

/** Pour une opération : « −32,85 € » ou « +45,00 € ». */
export function formaterOperation(centimes: number): string {
  return `${centimes < 0 ? '−' : '+'}${formaterMontant(centimes)}`
}

/** Le solde en deux parties, pour composer les centimes plus petits. */
export function decouperSolde(centimes: number): { entier: string; decimales: string } {
  const texte = formaterMontant(centimes)
  const virgule = texte.lastIndexOf(',')
  return { entier: texte.slice(0, virgule), decimales: texte.slice(virgule) }
}
