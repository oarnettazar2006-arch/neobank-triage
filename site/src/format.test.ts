import { describe, expect, it } from 'vitest'
import { decouperSolde, formaterMontant, formaterOperation } from './format'

// Intl écrit l'espace fine insécable (U+202F) et l'espace insécable (U+00A0).
const normal = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ')

describe('format', () => {
  it('écrit un montant à la française', () => {
    expect(normal(formaterMontant(231846))).toBe('2 318,46 €')
    expect(normal(formaterMontant(-460))).toBe('4,60 €')
  })

  it('signe les opérations avec un vrai signe moins et un plus explicite', () => {
    expect(normal(formaterOperation(-3285))).toBe('−32,85 €')
    expect(normal(formaterOperation(4500))).toBe('+45,00 €')
  })

  it('découpe le solde avant la virgule', () => {
    const { entier, decimales } = decouperSolde(231846)
    expect(normal(entier)).toBe('2 318')
    expect(normal(decimales)).toBe(',46 €')
  })
})
