# Singgah

A personal, mobile-first map of places you've saved, mostly found on social media. It's focused on Malaysia. Everything stays on your device.

## Features

- **Map** (Leaflet + OpenStreetMap, no API key): pins coloured by category, clustering, filter chips, and a bottom-sheet preview with cover photo, open/closed badge and distance. It centres on your location, or on the Klang Valley if location is denied.
- **Categories**: 8 presets you can rename, recolour, reorder, delete (move their spots elsewhere or delete them) and add to.
- **Add / edit a spot**: set the location by Nominatim address search (biased to Malaysia), by dropping or dragging a pin, or from your current location. You can also add operating hours (per day, split hours, overnight, 24h, copy Monday), compressed photos (~1200px, reorderable, first is the cover, full-screen viewer), social links (TikTok/Instagram/Threads/Facebook/YouTube detection, TikTok oEmbed thumbnail and author) and hashtags.
- **See what people say**: open each hashtag on Threads, Instagram or TikTok, plus a TikTok name search. Saved links appear as "Original posts".
- **Search** across name, category, address, notes and tags, with results grouped as Places, Categories and Tags.
- **List view**: sort by nearest, newest or name, with the same filters as the map.
- **On the way**: pick a destination (and optionally a start point and departure time) to see saved spots within 1/3/5/10 km of the driving route, in driving order. Each result shows its distance off the route, an estimated arrival time and whether it'll be open then, with Waze/Google Maps buttons. The last 5 routes are kept for one-tap reuse, and you can rename them (e.g. "Balik kampung Ipoh").
- **Practical info**: optional halal status, surau, parking, setting (indoor/outdoor) and a kid-friendly checklist, all set by you and never guessed. They show as badges, can be filtered with "Filters", and are searchable ("halal", "surau", "stroller").
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

## Configuration

- **Practical tags**: `src/config/practicalTags.ts` holds every tag, option (EN/BM label, icon, keywords) and filter preset. Add or edit entries there and the form, badges, place page, filters and search pick them up.
- **Routing**: `src/lib/routing.ts` defines a `RoutingProvider` interface. The default is the public OSRM demo server, which is **for development only**. For production, run your own OSRM, or implement a provider for OpenRouteService or Google and call `setRoutingProvider(...)` once at startup.

## Data & migrations

The IndexedDB schema is versioned in `src/db.ts`:

- v1: categories, places, photos
- v2: `routes` table (recent "On the way" routes)
- v3: `practical` field on every place (existing spots get `{}`, meaning all Unknown)

Backups are JSON version 2 and include routes. Version 1 backups still import.

## Notes

- Nominatim is called only when you press search, to respect its usage policy.
- TikTok's CDN sometimes blocks cross-origin image downloads. If it does, "Add thumbnail to photos" shows a message instead.
