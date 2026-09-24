import { Barres, Chiffre, Figure, Grille, Pastille, type Case } from './graphiques'
import { CHAMP, COLONNES, libelle, VALEURS } from './libelles'
import { pct, pctRond, retenirConfusion, retenirCroise, retenirPrecision, retenirRepartition } from './retenir'
import type { Analyse as DonneesAnalyse, Colonne, MetriqueChamp, Metriques } from './types'

const s = (n: number) => (n > 1 ? 's' : '')

const TITRE: Record<Colonne, string> = {
  categorie: 'Catégorie prédite',
  produit: 'Produit prédit',
  severite: 'Gravité prédite',
}

function Repartition({ col, comptes }: { col: Colonne; comptes: Record<string, number> }) {
  const total = Object.values(comptes).reduce((a, b) => a + b, 0)
  const max = Math.max(1, ...Object.values(comptes))
  return (
    <Figure
      titre={TITRE[col]}
      sousTitre={`Nombre de tickets par valeur, sur ${total} ticket${s(total)} trié${s(total)}.`}
      retenir={retenirRepartition(col, comptes)}
    >
      <Barres
        max={max}
        axe="Nombre de tickets"
        barres={Object.entries(comptes).map(([code, n]) => ({
          cle: code,
          libelle: libelle(col, code),
          valeur: n,
          texte: total ? `${n} · ${pctRond(n, total)}` : '0',
          infobulle: `${libelle(col, code)} : ${n} ticket${s(n)} (${pctRond(n, total)})`,
        }))}
      />
    </Figure>
  )
}

function Croise({ croise }: { croise: Record<string, Record<string, number>> }) {
  const max = Math.max(1, ...Object.values(croise).flatMap((l) => Object.values(l)))
  const cases = (p: string, g: string): Case => {
    const n = croise[p]?.[g] ?? 0
    return {
      n,
      ton: n ? 'accent' : 'vide',
      intensite: n / max,
      infobulle: `${libelle('produit', p)}, gravité ${libelle('severite', g).toLowerCase()} : ${n} ticket${s(n)}`,
    }
  }
  return (
    <Figure
      titre="Produit × gravité"
      sousTitre="Nombre de tickets pour chaque couple produit et gravité prédits. Plus la case est foncée, plus il y en a."
      retenir={retenirCroise(croise)}
    >
      <Grille
        axeLignes="Produit"
        axeColonnes="Gravité"
        totaux
        lignes={Object.keys(VALEURS.produit).map((cle) => ({ cle, libelle: libelle('produit', cle) }))}
        colonnes={Object.keys(VALEURS.severite).map((cle) => ({ cle, libelle: libelle('severite', cle) }))}
        cases={cases}
      />
    </Figure>
  )
}

function Precision({ m }: { m: Metriques }) {
  const champs = COLONNES.flatMap((c) => {
    const f = m.fields[c]
    return f ? [{ c, f }] : []
  })
  const barre = (cle: string, nom: string, k: number, n: number) => ({
    cle,
    libelle: nom,
    valeur: n ? (100 * k) / n : 0,
    texte: `${pct(k, n)} · ${k}/${n}`,
    infobulle: `${nom} : ${k} justes sur ${n} (${pct(k, n)})`,
  })
  const barres = champs.map(({ c, f }) => barre(c, CHAMP[c], f.correct, f.n))
  if (m.exact.over.length > 1) barres.push(barre('exact', 'Tout juste', m.exact.correct, m.exact.n))
  return (
    <Figure
      titre="Justesse par champ"
      sousTitre="Part des tickets où la prédiction égale la bonne réponse. « Tout juste » : tous les champs fournis sont justes."
      retenir={retenirPrecision(m)}
    >
      <Barres
        max={100}
        axe="Tickets justes (%)"
        graduationsFixes={[0, 25, 50, 75, 100]}
        formatGraduation={(v) => `${v} %`}
        barres={barres}
      />
    </Figure>
  )
}

function Confusion({ col, f }: { col: Colonne; f: MetriqueChamp }) {
  const diag = Math.max(1, ...f.labels.map((l) => f.matrix[l]?.[l] ?? 0))
  const hors = Math.max(1, ...f.labels.flatMap((v) => f.labels.filter((p) => p !== v).map((p) => f.matrix[v]?.[p] ?? 0)))
  const cases = (vraie: string, predite: string): Case => {
    const n = f.matrix[vraie]?.[predite] ?? 0
    const nom = `Bonne réponse ${libelle(col, vraie)}, prédiction ${libelle(col, predite)} : ${n} ticket${s(n)}`
    if (!n) return { n, ton: 'vide', intensite: 0, infobulle: nom }
    return vraie === predite
      ? { n, ton: 'accent', intensite: n / diag, infobulle: `${nom} (justes)` }
      : { n, ton: 'danger', intensite: 0.35 + (0.4 * n) / hors, infobulle: `${nom} (erreur${s(n)})` }
  }
  const axe = f.labels.map((cle) => ({ cle, libelle: libelle(col, cle) }))
  return (
    <Figure
      titre={`${CHAMP[col]} : ${f.correct} justes sur ${f.n}`}
      sousTitre="Matrice de confusion. Lignes : bonne réponse. Colonnes : prédiction du bot."
      legende={
        <>
          <Pastille couleur="accent">Justes (diagonale)</Pastille>
          <Pastille couleur="danger">Erreurs</Pastille>
        </>
      }
      retenir={retenirConfusion(col, f)}
    >
      <Grille axeLignes="Bonne réponse" axeColonnes="Prédiction du bot" lignes={axe} colonnes={axe} cases={cases} />
    </Figure>
  )
}

/** Les chiffres clés et les graphiques du lot, recalculés à chaque tri de ticket. */
export function Analyse({ analyse, total }: { analyse: DonneesAnalyse; total: number }) {
  const a = analyse
  const m = a.metriques
  const partiel = a.tickets < total
  return (
    <>
      <section aria-labelledby="titre-remplis" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titre-remplis" className="text-section font-semibold tracking-[-0.01em] text-text">
            Ce que le bot a rempli
          </h2>
          {partiel && (
            <p className="text-petit text-text-2">
              Sur les {a.tickets} tickets déjà triés. Mis à jour à chaque ticket.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Chiffre libelle="Tickets triés" valeur={`${a.tickets}`} detail={`sur ${total}`} />
          <Chiffre
            libelle="Réclamations"
            valeur={`${a.reclamations}`}
            detail={a.tickets ? `${pctRond(a.reclamations, a.tickets)} des tickets, délai légal` : undefined}
          />
          <Chiffre libelle="Tickets suspects" valeur={`${a.suspects}`} detail="injection repérée par la garde" />
          {m ? (
            <Chiffre
              libelle="Entièrement justes"
              valeur={`${m.exact.correct} sur ${m.exact.n}`}
              detail={`${pct(m.exact.correct, m.exact.n)} · ${m.exact.over.map((c) => CHAMP[c].toLowerCase()).join(', ')}`}
            />
          ) : (
            <Chiffre libelle="Entièrement justes" valeur="n/a" detail="pas de bonnes réponses dans le CSV" />
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
          {COLONNES.map((c) => (
            <Repartition key={c} col={c} comptes={a.repartitions[c]} />
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <Croise croise={a.repartitions.produit_x_severite} />
          {m && <Precision m={m} />}
        </div>
      </section>

      {m && (
        <section aria-labelledby="titre-justesse" className="space-y-4">
          <h2 id="titre-justesse" className="text-section font-semibold tracking-[-0.01em] text-text">
            Comparaison avec les bonnes réponses
          </h2>
          {/* Le produit a cinq valeurs : sa matrice prend plus de place que les deux autres. */}
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
            {COLONNES.map((c) => {
              const f = m.fields[c]
              return f ? <Confusion key={c} col={c} f={f} /> : null
            })}
          </div>
        </section>
      )}
    </>
  )
}
