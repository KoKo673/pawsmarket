/**
 * The client half of a rule the server also implements.
 *
 * app/textsearch.py normalises `search_text` at write time and the incoming
 * query at read time. This file exists because the client filters too — by
 * price, category and kind, all client-side by design — and if the two
 * normalisations disagree, the server returns a row the client then hides.
 *
 * Run with: npm test  (node --test, no dependencies)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { normaliseFa } from './fa-normalise.ts'

test('Arabic kaf and yeh become Persian', () => {
  // The 97.5% → 99.1% step: the same letter, two code points.
  assert.equal(normaliseFa('كلينيك'), 'کلینیک')
  assert.equal(normaliseFa('بيمارستان'), 'بیمارستان')
})

test('ZWNJ becomes a space, not nothing', () => {
  // Deleting it gives «پتشاپ», which matches neither spelling.
  assert.equal(normaliseFa('پت‌شاپ'), 'پت شاپ')
  assert.equal(normaliseFa('پت شاپ'), 'پت شاپ')
})

test('both spellings normalise to the same string', () => {
  assert.equal(normaliseFa('پت‌شاپ رخ'), normaliseFa('پت شاپ رخ'))
  assert.equal(normaliseFa('كلينيك ريكو'), normaliseFa('کلینیک ریکو'))
})

test('whitespace is collapsed and trimmed', () => {
  assert.equal(normaliseFa('  چند   فاصله  '), 'چند فاصله')
})

test('empty input is empty output, never a throw', () => {
  assert.equal(normaliseFa(''), '')
  assert.equal(normaliseFa(null), '')
  assert.equal(normaliseFa(undefined), '')
})

test('Latin text passes through untouched', () => {
  // No transliteration: a Latin query is compared as written.
  assert.equal(normaliseFa('Dr. Allen'), 'Dr. Allen')
})
