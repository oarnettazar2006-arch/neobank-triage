/** Fond vivant (DESIGN.md 4.3) : calque fixe et statique, obligatoire derrière le verre. */
export function FondVivant({ haloCarte = false }: { haloCarte?: boolean }) {
  return <div className="fond-vivant" data-halo-carte={haloCarte || undefined} aria-hidden="true" />
}
