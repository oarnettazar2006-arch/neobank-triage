/**
 * Goutte du logo (PNG détouré, 2x) et mot VAULT en Manrope, en attendant le SVG.
 * Deux fichiers : la goutte extraite du panneau sombre et celle du panneau clair.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <img src="/marque/vault-goutte@2x.png" alt="" width={24} height={28} className="logo-sombre h-7 w-auto" />
      <img src="/marque/vault-goutte-clair@2x.png" alt="" width={26} height={28} className="logo-clair h-7 w-auto" />
      <span className="text-[1.0625rem] leading-6 font-bold tracking-[0.02em] text-text">VAULT</span>
    </span>
  )
}
