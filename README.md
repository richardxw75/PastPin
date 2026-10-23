# PastPin — toen & nu, op de kaart

Lokaal werkend prototype waarmee gebruikers historische foto's en video's op een
interactieve kaart vinden en toevoegen. Stijl geïnspireerd op ClimateScan: frisse
groene UI, kaart als hoofdscherm, zijpaneel met details.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Leaflet + react-leaflet

## Starten

```bash
npm install
npm run dev          # http://localhost:3000
```

**Testen op je telefoon in het veld:** GPS en de camera werken in browsers alleen via
`https` of `localhost`. Gebruik daarom:

```bash
npm run dev:https    # https://<ip-van-je-laptop>:3000 (accepteer het self-signed certificaat)
```

## Functionaliteit

- **Overzichtskaart** – pins per categorie (groen 📷 = historische foto, oranje 🎬 = video),
  zoeken op titel/beschrijving/jaar/maker, filterchips (die ook als legenda dienen),
  "toon mijn locatie".
- **Detailpaneel** – zijpaneel op desktop, bottom sheet op mobiel; titel, beschrijving,
  jaartal, uploader, coördinaten en link naar OpenStreetMap.
- **Toen & Nu-slider** – sleepbare vergelijkingsbalk (muis, touch én toetsenbord) plus
  snelknoppen *Toen / Vergelijk / Nu*.
- **Inloggen/registreren (gesimuleerd)** – vereist voordat je iets plaatst; je naam
  wordt aan de pin gekoppeld. Je kunt alleen je eigen pins verwijderen.
- **Media toevoegen** – locatie via klik op de kaart, versleepbare pin of GPS; keuze
  tussen *Historische foto* (verplicht twee foto's: toen + nu) of *Video* (bestand of
  YouTube/Vimeo/mp4-link). Validatie op jaartallen en verplichte velden.

## Architectuur

```
app/
  layout.tsx            Providers (Auth → Media), Leaflet-CSS, viewport
  page.tsx              <MapApp />
  globals.css           Tailwind + pin/tooltip-styling voor Leaflet
components/
  MapApp.tsx            Orkestratie: selectie, filters, toevoeg-/plaatsmodus, modals
  Header.tsx            Logo, "+ Media toevoegen", account-menu
  FilterBar.tsx         Zoeken + categoriefilter (legenda)
  map/
    MapView.tsx         Leaflet-kaart (client-only via next/dynamic), markers,
                        klik-om-te-plaatsen, versleepbare concept-pin, fly-to, locatieknop
    markerIcons.ts      DivIcons per categorie
  media/
    DetailPanel.tsx     Zijpaneel / bottom sheet met metadata
    BeforeAfterSlider.tsx  De 'Toen & Nu'-vergelijkingsslider
    VideoPlayer.tsx     Embed (YouTube/Vimeo) of <video>
  upload/
    AddMediaPanel.tsx   Uploadformulier in 4 stappen incl. dubbele foto-upload
    ImageDropzone.tsx   Bestand kiezen / slepen / camera (mobiel) met preview
  auth/AuthModal.tsx    Inloggen / registreren
  providers/
    AuthProvider.tsx    Gesimuleerde accounts + sessie (localStorage)
    MediaProvider.tsx   CRUD voor media; voorbeelddata + gebruikersuploads
  ui/                   Modal, iconen
lib/
  types.ts              MediaItem = PhotoItem | VideoItem
  storage.ts            localStorage (metadata, accounts, sessie)
  fileStore.ts          IndexedDB voor binaire bestanden (foto's/video's)
  useMediaSrc.ts        Zet `idb:<key>` om naar een object-URL
  image.ts              Foto's verkleinen naar JPEG (max. 1800 px) vóór opslag
  video.ts              Herkennen van YouTube/Vimeo/directe videolinks
  seed.ts, seedArt.ts   Voorbeeldpins met gegenereerde toen/nu-illustraties (offline)
```

### Dataopslag (prototype)

- **Metadata** (titel, jaartal, coördinaten, uploader) → `localStorage` (`pastpin.media.v1`).
- **Bestanden** → IndexedDB. `localStorage` is beperkt tot ~5 MB tekst; twee foto's als
  base64 zouden die limiet al na een paar uploads vullen. In de metadata staat een
  verwijzing `idb:<key>`.
- Voorbeelddata (`lib/seed.ts`) wordt altijd meegeladen en is niet verwijderbaar.
- Alles leeft in de browser: wis sitedata om opnieuw te beginnen.

### Naar productie

| Prototype | Productie |
|---|---|
| `AuthProvider` (localStorage, wachtwoordhash in de browser) | NextAuth / Supabase Auth / Clerk |
| `MediaProvider` + `storage.ts` | API-routes + database (bijv. Postgres/PostGIS) |
| `fileStore.ts` (IndexedDB) | Object storage (S3/R2) met signed uploads |
| Alle pins in één keer laden | Bounding-box queries + marker clustering |

De componenten praten alleen met `useAuth()` en `useMedia()`, dus de opslaglaag kan
vervangen worden zonder de UI aan te passen.

## Opmerkingen

- De voorbeeldpins gebruiken **gegenereerde illustraties**, geen echte archieffoto's, en
  één CC0-voorbeeldvideo van MDN. Vervang ze in `lib/seed.ts` door echt materiaal
  (met juiste licenties/bronvermelding).
- Kaarttegels: CARTO Voyager op basis van OpenStreetMap (internet vereist).
