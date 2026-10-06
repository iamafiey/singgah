import { describe, expect, it } from 'vitest'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { DARK, LIGHT, urbanStyle } from '../mapStyle'

describe('urbanStyle', () => {
  it('is a valid MapLibre style in both themes', () => {
    for (const p of [LIGHT, DARK]) expect(validateStyleMin(urbanStyle(p))).toEqual([])
  })
})
