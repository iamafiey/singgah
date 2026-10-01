# Singgah

A personal, mobile-first map of places you've saved, mostly found on social media. It's focused on Malaysia. Everything stays on your device.

## Features

- **Map** (Leaflet + OpenStreetMap, no API key): pins coloured by category, clustering, filter chips, and a bottom-sheet preview with cover photo, open/closed badge and distance. It centres on your location, or on the Klang Valley if location is denied.
- **Categories**: 8 presets you can rename, recolour, reorder, delete (move their spots elsewhere or delete them) and add to.
- **Add / edit a spot**: set the location by Nominatim address search (biased to Malaysia), by dropping or dragging a pin, or from your current location. You can also add operating hours (per day, split hours, overnight, 24h, copy Monday), compressed photos (~1200px, reorderable, first is the cover, full-screen viewer), social links (TikTok/Instagram/Threads/Facebook/YouTube detection, TikTok oEmbed thumbnail and author) and hashtags.
- **See what people say**: open each hashtag on Threads, Instagram or TikTok, plus a TikTok name search. Saved links appear as "Original posts".
- **Search** across name, category, address, notes and tags, with results grouped as Places, Categories and Tags.
- **List view**: sort by nearest, newest or name, with the same filters as the map.
- **Place actions**: directions in Waze or Google Maps, edit, delete, mark as visited, and share (copies a text summary).
- **Data**: stored in IndexedDB (Dexie), with JSON backup export/import (merge or replace). Five sample spots around Bangi/Kajang come with a "Clear sample data" button.
- Light/dark/system theme, and English / Bahasa Melayu.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (hours, link detection, search)
npm run build    # static build in dist/ (relative paths, works on any static host)
```

The app uses hash routing (`#/list`, `#/place/:id`, …), so `dist/` can be served from any static host or sub-path.

## Notes

- Nominatim is called only when you press search, to respect its usage policy.
- TikTok's CDN sometimes blocks cross-origin image downloads. If it does, "Add thumbnail to photos" shows a message instead.
