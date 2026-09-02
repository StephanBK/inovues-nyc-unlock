# INOVUES — "One hospital unlocks a city"

Static web visuals for an investor deck: INOVUES' Woodhull Hospital SWR install (1,134 units, NYSERDA-funded) as the entry point to the 2,547 City-owned buildings (196M sq ft) that DCAS Energy Management funds retrofits for.

## Run
`python3 -m http.server 8080` → http://localhost:8080 (launcher). No build step. Deploy = GitHub Pages from `main` root.
`config.js` holds the Mapbox public token. It is committed and the repo is public (needed for free GitHub Pages), so keep the token URL-restricted in the Mapbox dashboard. Live site: https://stephanbk.github.io/inovues-nyc-unlock/

## Files
- `index.html` launcher · `ripple3d.html` (current favorite: ring sweeps from Woodhull over real 3D footprints) · `ripple.html` (flat dots) · `scenes.html` (4 click-through scenes) · `hybrid.html` (constellation + map) · `constellation.html` (no map) · `original.html` (v1, reference)
- `shared.js` palette (`COLORS`), Mapbox factory, data loader, constellation renderer · `shared.css`
- `buildings.json` 2,328 points (agency, sqft, t, w, wood) · `footprints.json` real footprints + roof height (m) · `agg.json` agency/borough totals
- Data source: NYC Open Data — DCAS LL24 Municipal Solar-Readiness Assessment (cfz5-6fvh, 2024) joined to Building Footprints (5zhs-2jue) on BIN. Source xlsx: `NYC_DCAS_LL24_City_Buildings.xlsx`.

## Conventions
- Dark theme (#0B0F19), Inter Tight, cyan #00E5FF = Woodhull/H+H, agency colors in `shared.js`. Keep it clean: one idea per screen, no clutter.
- Owner: Stephan (VP of Operations, INOVUES). Prefers small confirmed increments; explain concepts briefly as you go.
