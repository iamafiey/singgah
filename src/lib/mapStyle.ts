import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl'

/**
 * "Urban blueprint"-like basemap: a calm grey base, grey buildings, warm orange main roads and
 * small uppercase area names, inspired by styledmap.com's UrbanBlueprint (a Google Maps style).
 * Uses free OpenFreeMap vector tiles (OpenMapTiles schema) — no API key.
 */
export interface MapPalette {
  background: string
  park: string
  water: string
  waterLabel: string
  building: string
  buildingLine: string
  motorway: string
  motorwayCasing: string
  major: string
  majorCasing: string
  secondary: string
  minor: string
  minorCasing: string
  rail: string
  label: string
  labelMuted: string
  halo: string
}

export const LIGHT: MapPalette = {
  background: '#ececea',
  park: '#e1e5dc',
  water: '#c8d4dd',
  waterLabel: '#7d93a3',
  building: '#d7d7d4',
  buildingLine: '#cacac6',
  motorway: '#f3a73a',
  motorwayCasing: '#d98a1f',
  major: '#f7bd4f',
  majorCasing: '#e3a53a',
  secondary: '#fbd98f',
  minor: '#ffffff',
  minorCasing: '#dcdcd8',
  rail: '#b9b9b5',
  label: '#3d3d3d',
  labelMuted: '#8a8a86',
  halo: '#f4f4f2',
}

export const DARK: MapPalette = {
  background: '#1f2022',
  park: '#232824',
  water: '#18232c',
  waterLabel: '#5f7686',
  building: '#2b2c2f',
  buildingLine: '#333438',
  motorway: '#c9822a',
  motorwayCasing: '#8f5a17',
  major: '#b98a3a',
  majorCasing: '#7d5c22',
  secondary: '#7d6a45',
  minor: '#3a3b3f',
  minorCasing: '#2a2b2e',
  rail: '#4a4b4f',
  label: '#d8d8d6',
  labelMuted: '#8e8e8a',
  halo: '#1f2022',
}

const TILES = 'https://tiles.openfreemap.org/planet'
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
const name: ExpressionSpecification = ['coalesce', ['get', 'name:latin'], ['get', 'name']]
const cls = (...classes: string[]): ExpressionSpecification => ['match', ['get', 'class'], classes, true, false]
const w = (pairs: [number, number][]): ExpressionSpecification => ['interpolate', ['exponential', 1.5], ['zoom'], ...pairs.flat()]

export function urbanStyle(c: MapPalette): StyleSpecification {
  const roadFilter = (...classes: string[]): ExpressionSpecification => ['all', cls(...classes), ['!=', ['get', 'brunnel'], 'tunnel']]
  return {
    version: 8,
    name: 'Singgah urban',
    glyphs: GLYPHS,
    sources: { omt: { type: 'vector', url: TILES, attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': c.background } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': c.park } },
      { id: 'landcover-green', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: cls('wood', 'grass'), paint: { 'fill-color': c.park, 'fill-opacity': 0.7 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': c.water } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': c.water, 'line-width': w([[10, 0.5], [16, 3]]) } },
      { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, paint: { 'fill-color': c.building, 'fill-outline-color': c.buildingLine } },
      { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: cls('rail', 'transit'), minzoom: 11, paint: { 'line-color': c.rail, 'line-width': 1.2, 'line-dasharray': [3, 2] } },
      // Casings
      { id: 'road-minor-casing', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: roadFilter('minor', 'service'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.minorCasing, 'line-width': w([[13, 1.5], [18, 16]]) } },
      { id: 'road-major-casing', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 8, filter: roadFilter('trunk', 'primary'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.majorCasing, 'line-width': w([[8, 1.5], [18, 26]]) } },
      { id: 'road-motorway-casing', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 5, filter: roadFilter('motorway'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.motorwayCasing, 'line-width': w([[5, 1], [18, 30]]) } },
      // Fills
      { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: roadFilter('minor', 'service'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.minor, 'line-width': w([[13, 0.8], [18, 13]]) } },
      { id: 'road-tertiary', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 11, filter: roadFilter('tertiary'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.minor, 'line-width': w([[11, 0.8], [18, 16]]) } },
      { id: 'road-secondary', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: roadFilter('secondary'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.secondary, 'line-width': w([[9, 0.8], [18, 20]]) } },
      { id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 8, filter: roadFilter('trunk', 'primary'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.major, 'line-width': w([[8, 0.8], [18, 22]]) } },
      { id: 'road-motorway', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 5, filter: roadFilter('motorway'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.motorway, 'line-width': w([[5, 0.6], [18, 26]]) } },
      // Labels
      { id: 'water-name', type: 'symbol', source: 'omt', 'source-layer': 'water_name', layout: { 'text-field': name, 'text-font': ['Noto Sans Italic'], 'text-size': 11 }, paint: { 'text-color': c.waterLabel, 'text-halo-color': c.halo, 'text-halo-width': 1 } },
      { id: 'road-name', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 13, layout: { 'symbol-placement': 'line', 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': w([[13, 9], [18, 12]]), 'text-max-angle': 30 }, paint: { 'text-color': c.labelMuted, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
      { id: 'place-area', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 12, filter: cls('suburb', 'neighbourhood', 'quarter', 'hamlet'), layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 9.5, 'text-transform': 'uppercase', 'text-letter-spacing': 0.08, 'text-max-width': 8 }, paint: { 'text-color': c.labelMuted, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
      { id: 'place-town', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 8, filter: cls('town', 'village'), layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': w([[8, 10], [14, 14]]) }, paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
      { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', filter: cls('city'), layout: { 'text-field': name, 'text-font': ['Noto Sans Bold'], 'text-size': w([[5, 11], [12, 17]]) }, paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
    ],
  }
}
