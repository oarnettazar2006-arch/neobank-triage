/** Goutte du logo (PNG détouré 2x, une version par thème) et mot VAULT, en attendant le SVG. */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <img src="/marque/vault-goutte@2x.png" alt="" width={22} height={26} className="logo-sombre h-[26px] w-auto" />
      <img src="/marque/vault-goutte-clair@2x.png" alt="" width={24} height={26} className="logo-clair h-[26px] w-auto" />
      <span className="text-[1.0625rem] leading-none font-semibold tracking-[0.08em] text-text">VAULT</span>
    </span>
  )
}
