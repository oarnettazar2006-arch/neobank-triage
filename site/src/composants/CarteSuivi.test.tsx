import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { maquettes } from '../api/maquettes'
import { CarteSuivi } from './CarteSuivi'

// Les attentes ne portent que sur les champs du contrat : aucune date n'est
// recalculée ici, comme dans le composant.
const rendu = (reference: string) => {
  const ticket = maquettes[reference]!
  const html = renderToStaticMarkup(<CarteSuivi ticket={ticket} />).replaceAll(' ', ' ')
  return { ticket, html }
}

describe('CarteSuivi', () => {
  it.each(Object.keys(maquettes))('affiche la date légale et la référence de %s telles que fournies', (ref) => {
    const { ticket, html } = rendu(ref)
    const reponse = ticket.echeances.find((e) => e.kind === 'reponse')!
    const [jour, quantieme, ...suite] = reponse.texte.split(' ')
    expect(html).toContain(`${jour} ${quantieme}`)
    expect(html).toContain(suite.join(' '))
    expect(html).toContain(ticket.recu_le.court)
    expect(html).toContain(reponse.court)
    expect(html).toContain(`Réf. ${ticket.reference}`)
    expect(html).toContain(`--p:${Math.min(ticket.progression, 1)}`)
  })

  it('annonce l’échéance proche avec les jours ouvrés de l’API, sans rouge', () => {
    const { ticket, html } = rendu('VLT-2026-004093')
    expect(ticket.delai).toBe('proche')
    expect(html).toContain(`Échéance dans ${ticket.jours_ouvres_restants} jours ouvrés`)
    expect(html).not.toContain('text-danger')
  })

  it('annonce l’échéance dépassée avec la date de l’API', () => {
    const { ticket, html } = rendu('VLT-2026-004061')
    const reponse = ticket.echeances.find((e) => e.kind === 'reponse')!
    expect(html).toContain(`Échéance dépassée le ${reponse.texte}.`)
  })

  it('donne la date d’envoi de la réponse quand elle existe', () => {
    const { ticket, html } = rendu('VLT-2026-004012')
    expect(html).toContain('Réponse envoyée')
    expect(html).toContain(`le ${ticket.reponse_envoyee_le!.texte}`)
  })
})
