import { describe, expect, it } from 'vitest'
import { plain, splitBody, wordCount } from './text'

describe('texte des lettres', () => {
  it('découpe en paragraphes et lignes sans modifier le texte', () => {
    const body = 'Ligne 1\nLigne 2\n\nParagraphe 2  avec deux espaces'
    expect(splitBody(body)).toEqual([['Ligne 1', 'Ligne 2'], ['Paragraphe 2  avec deux espaces']])
  })

  it('interprète la mise en forme WhatsApp sans changer les mots', () => {
    expect(plain('le plus beau des cadeaux : *_Toi_*.')).toBe('le plus beau des cadeaux : Toi.')
    expect(plain('Cordialement Mr _*NOM*._')).toBe('Cordialement Mr NOM.')
    expect(plain('2 * 3 = 6 et un_mot_composé')).toBe('2 * 3 = 6 et un_mot_composé')
  })

  it('compte les mots', () => {
    expect(wordCount('  Joyeux   anniversaire !\n')).toBe(3)
  })
})
