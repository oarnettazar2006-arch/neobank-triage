import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Analyse } from './Analyse'
import { Entree } from './Entree'
import { DEMO15 } from './fixtures'
import { TableauTickets } from './TableauTickets'

const net = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ')
const analyse = net(renderToStaticMarkup(<Analyse analyse={DEMO15.analyse} total={15} />))
const tableau = net(
  renderToStaticMarkup(<TableauTickets lotId={DEMO15.id} lignes={DEMO15.lignes} termine avecBonnes />),
)

describe('entrée', () => {
  it('garde deux entrées visibles : déposer un CSV, ou écrire un ticket', () => {
    const html = renderToStaticMarkup(<Entree onLance={() => {}} />)
    expect(html).toContain('Déposer un CSV')
    expect(html).toContain('Choisir un fichier')
    expect(html).toContain('Écrire un ticket')
    expect(html).toContain('Trier ce ticket')
  })
})

describe('analyse (demo15, vrai tri)', () => {
  it('affiche les chiffres de make triage : 14/15, 14/15, 13/15, 11/15', () => {
    expect(analyse).toContain('Catégorie : 14 justes sur 15')
    expect(analyse).toContain('Produit : 14 justes sur 15')
    expect(analyse).toContain('Gravité : 13 justes sur 15')
    expect(analyse).toContain('11 sur 15')
    expect(analyse).toContain('93,3 % · 14/15')
    expect(analyse).toContain('73,3 % · 11/15')
  })

  it('chaque graphique a un titre, des axes nommés et une phrase à retenir', () => {
    const figures = analyse.split('<figure').slice(1)
    expect(figures).toHaveLength(8)   // 3 répartitions, produit x gravité, justesse, 3 matrices
    for (const f of figures) {
      expect(f).toMatch(/<h3[^>]*>[^<]+<\/h3>/)
      expect(f).toContain('À retenir : </span>')
    }
    expect(analyse.match(/Nombre de tickets<\/p>/g)).toHaveLength(3)
    expect(analyse).toContain('Tickets justes (%)')
    expect(analyse.match(/Bonne réponse<\/th>/g)).toHaveLength(3)
    expect(analyse.match(/Prédiction du bot<\/th>/g)).toHaveLength(3)
    expect(analyse).toContain('>Produit</th>')
    expect(analyse).toContain('>Gravité</th>')
  })

  it('n’écrit aucun tiret cadratin', () => {
    expect(analyse + tableau).not.toMatch(/[—–]/)
  })
})

describe('tableau des tickets', () => {
  it('une ligne par ticket, suspects marqués, erreurs avec la bonne réponse', () => {
    expect(tableau.match(/<tr class="border-b/g)).toHaveLength(15)
    expect(tableau).toContain('aria-label="Ticket suspect"')
    expect(tableau).toContain('attendu Moyenne')
    expect(tableau).toContain('Erreurs du bot <span class="montant">4</span>')
  })

  it('export CSV une fois le tri terminé seulement', () => {
    expect(tableau).toContain(`/lots/${DEMO15.id}/export.csv`)
    const enCours = renderToStaticMarkup(<TableauTickets lotId="LOT-X" lignes={DEMO15.lignes} termine={false} avecBonnes />)
    expect(enCours).not.toContain('export.csv')
  })

  it('le texte d’un ticket est rendu comme du texte, jamais comme du HTML', () => {
    const [premiere] = DEMO15.lignes
    const html = renderToStaticMarkup(
      <TableauTickets lotId="LOT-X" lignes={[{ ...premiere!, ticket: '<img src=x onerror=alert(1)>' }]} termine avecBonnes />,
    )
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })
})
