import L from 'leaflet'
import { DARK, LIGHT, urbanStyle } from './mapStyle'

export type MapTheme = 'light' | 'dark'

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function rasterLayer(): L.TileLayer {
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'raster-tiles',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
}

/**
 * Adds the styled vector basemap (MapLibre, loaded on demand) under a Leaflet map.
 * Falls back to plain OpenStreetMap raster tiles when WebGL is unavailable or the vector
 * style can't load. Returns a function that removes whatever was added.
 */
export function addBasemap(map: L.Map, theme: MapTheme): () => void {
  const GL_ATTRIBUTION = '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  let layer: L.Layer | null = null
  let cancelled = false
  const useRaster = () => {
    if (cancelled) return
    if (layer) map.removeLayer(layer)
    map.attributionControl?.removeAttribution(GL_ATTRIBUTION)
    layer = rasterLayer().addTo(map)
    map.getContainer().classList.add('basemap-raster')
  }

  if (!supportsWebGL()) {
    useRaster()
  } else {
    Promise.all([
      import('maplibre-gl'),
      import('@maplibre/maplibre-gl-leaflet'),
      // MapLibre looks for its worker next to its own file; Vite bundles it elsewhere, so point it at a built copy.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
      .then(([maplibre, plugin, worker]) => {
        if (cancelled) return
        if (maplibre.getWorkerUrl() !== worker.default) maplibre.setWorkerUrl(worker.default)
        const gl = plugin.maplibreGL({ style: urbanStyle(theme === 'dark' ? DARK : LIGHT), attributionControl: false })
        layer = gl.addTo(map)
        map.getContainer().classList.remove('basemap-raster')
        map.attributionControl?.addAttribution(GL_ATTRIBUTION)
        const glMap = gl.getMaplibreMap()
        // If the style or its tiles can't be fetched (offline, blocked), switch to raster tiles.
        let loaded = false
        glMap.once('load', () => (loaded = true))
        const timer = setTimeout(() => !loaded && useRaster(), 8000)
        // Only give up when the tile source itself can't load (offline, blocked). A missing tile or
        // font is not fatal; if nothing renders at all, the timer above takes over.
        glMap.on('error', (e: { sourceId?: string; tile?: unknown; error?: { message?: string } }) => {
          if (!loaded && e.sourceId && !e.tile) {
            clearTimeout(timer)
            useRaster()
          } else if (import.meta.env.DEV) console.warn('basemap', e.error?.message)
        })
      })
      .catch(useRaster)
  }

  return () => {
    cancelled = true
    if (layer) map.removeLayer(layer)
    map.attributionControl?.removeAttribution(GL_ATTRIBUTION)
  }
}
