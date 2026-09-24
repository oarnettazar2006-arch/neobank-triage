import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import evolution from '../../../../eval/evolution.json'
import { Comparateur, PromptsContenu } from './Prompts'
import type { Evolution } from './types'

const EVO = evolution as unknown as Evolution
const net = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ')
const html = net(renderToStaticMarkup(<PromptsContenu evo={EVO} />))

describe('onglet Prompts (eval/evolution.json réel)', () => {
  it('frise v0 à v7 : changement, raison et effet pour chaque étape', () => {
    const frise = html.split('id="titre-frise"')[1]!.split('id="titre-courbes"')[0]!
    expect(frise.match(/<li /g)).toHaveLength(8)
    expect(frise.match(/>Changement</g)).toHaveLength(8)
    expect(frise.match(/>Pourquoi</g)).toHaveLength(8)
    expect(frise.match(/Effet mesuré \(val60, contre v\d\)/g)).toHaveLength(7)
    expect(frise.match(/Prompt de tri inchangé/g)).toHaveLength(2)   // v5 et v6
    expect(frise).toContain('tag v7-final')
    expect(frise).toContain('11,7 % → 33,3 % (+21,7 points ; 16 corrigés, 3 cassés ; p = 0,004)')
  })

  it('dit que v5 et v6 ne changent pas le prompt de tri', () => {
    expect(html).toContain('v5 et v6 ne changent pas le prompt de tri.')
  })

  it('chaque graphique a un titre, des axes nommés, des libellés et une phrase à retenir', () => {
    // deux figures « à retenir » : courbes par version, note finale test100 ; chacune avec son titre h3
    expect(html.match(/À retenir : <\/span>/g)).toHaveLength(2)
    expect(html).toMatch(/<h3[^>]*>Précision par version, sur val60 \(60 tickets\)<\/h3>/)
    expect(html).toMatch(/<h3[^>]*>Précision par champ sur test100 \(100 tickets\)<\/h3>/)
    // six petits graphiques nommés, un par champ
    for (const nom of ['Tickets entièrement justes', 'Catégorie', 'Produit', 'Gravité', 'Réclamation', 'Paiement non autorisé'])
      expect(html).toContain(`aria-label="${nom}, part de tickets justes par version"`)
    expect(html).toContain('Axe horizontal : version du bot. Axe vertical : tickets justes (%).')
    expect(html).toContain('Tickets justes (%)</p>')
    expect(html.match(/<svg [^>]*role="img"/g)).toHaveLength(6)   // 5 champs + entièrement justes
    expect(html).toContain('Précision par version, sur val60 (60 tickets)')
  })

  it('test100 présenté à part, v0 contre v7', () => {
    const final = html.split('id="titre-final"')[1]!.split('id="titre-comparateur"')[0]!
    expect(final).toContain('Note finale sur test100 : v0 contre v7')
    expect(final).toContain('62,0 %')
    expect(final).toContain('8,0 %')
    const courbes = html.split('id="titre-courbes"')[1]!.split('id="titre-final"')[0]!
    expect(courbes).not.toContain('test100')
  })

  it('une commande Git par version, et le tag pour v7', () => {
    const git = html.split('id="titre-git"')[1]!
    for (const v of EVO.versions) expect(git).toContain(`git show --stat ${v.commit_court}`)
    expect(git).toContain('git show v7-final:prompts/v7_sous_motif.txt')
    // v5 et v6 : la commande prouve que le prompt de tri n'a pas bougé (sortie vide)
    expect(git).toContain(`git diff ${EVO.versions[4]!.commit_court} ${EVO.versions[5]!.commit_court} -- prompts/v4_injection.txt`)
    expect(git).toContain(`git diff ${EVO.versions[5]!.commit_court} ${EVO.versions[6]!.commit_court} -- prompts/v4_injection.txt`)
  })

  it('n’écrit aucun tiret cadratin', () => {
    expect(html).not.toMatch(/[—–]/)
  })
})

describe('comparateur', () => {
  it('par défaut v3 contre v4 : lignes ajoutées et retirées, mots ajoutés surlignés, et la commande Git', () => {
    const c = net(renderToStaticMarkup(<Comparateur versions={EVO.versions} />))
    expect(c).toContain('+26 lignes')   // comme git diff --stat : 26 insertions, 17 suppressions
    expect(c).toContain('−17 lignes')
    expect(c).toContain('<ins class')
    expect(c).toContain('&lt;ticket&gt;')
    expect(c).toContain('git diff 374c57f:prompts/v3_few_shot.txt bef4a9b:prompts/v4_injection.txt')
  })

  it('mots supprimés surlignés à part', () => {
    const c = net(renderToStaticMarkup(<Comparateur versions={EVO.versions} initial={['v4', 'v3']} />))
    expect(c).toContain('<del class')
    expect(c).not.toContain('<ins class')
  })

  it('v4 contre v5 : aucune différence, et la raison', () => {
    const c = net(renderToStaticMarkup(<Comparateur versions={EVO.versions} initial={['v4', 'v5']} />))
    expect(c).toContain('Aucune différence : v4 et v5 ont le même prompt de tri')
    expect(c).toContain('v5 et v6 ne changent pas le prompt de tri')
  })

  it('le texte d’un prompt est rendu comme du texte, jamais comme du HTML', () => {
    const piege = EVO.versions.map((v) => ({ ...v, prompt_texte: v.prompt_texte + '\n<img src=x onerror=alert(1)>' }))
    const c = renderToStaticMarkup(<Comparateur versions={piege} initial={['v0', 'v1']} />)
    expect(c).not.toContain('<img')
    const vide = renderToStaticMarkup(
      <Comparateur versions={[{ ...EVO.versions[0]!, prompt_texte: 'a' }, { ...EVO.versions[1]!, prompt_texte: 'a\n<img src=x>' }]} initial={['v0', 'v1']} />,
    )
    expect(vide).toContain('&lt;img src=x&gt;')
    expect(vide).not.toContain('<img')
  })
})
