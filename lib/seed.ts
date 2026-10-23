import type { MediaItem, Uploader } from "./types";
import { sceneDataUri } from "./seedArt";

const TEAM: Uploader = { id: "pastpin-team", name: "PastPin team" };
const CREATED = "2026-01-15T10:00:00.000Z";

// Openbaar CC0-voorbeeldfilmpje (MDN). Vervang door echte archiefbeelden.
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function photo(
  id: string,
  title: string,
  description: string,
  year: number,
  lat: number,
  lng: number,
  scene: { seed: number; canal?: boolean; rebuiltIndex?: number },
): MediaItem {
  return {
    id,
    kind: "photo",
    title,
    description,
    year,
    nowYear: 2025,
    lat,
    lng,
    thenImage: sceneDataUri("then", scene),
    nowImage: sceneDataUri("now", scene),
    uploader: TEAM,
    createdAt: CREATED,
    isSample: true,
  };
}

/** Voorbeeldpins met gegenereerde illustraties, zodat de kaart direct gevuld is. */
export function getSeedItems(): MediaItem[] {
  return [
    photo(
      "sample-amsterdam",
      "Grachtenpanden aan de Herengracht",
      "Voorbeeld: dezelfde gracht rond 1905 en nu. Let op het pand dat na de oorlog is vervangen door nieuwbouw. (Illustratie – voorbeelddata)",
      1905,
      52.37306,
      4.88948,
      { seed: 11, canal: true, rebuiltIndex: 4 },
    ),
    photo(
      "sample-utrecht",
      "Oudegracht bij de Werfkelders",
      "Voorbeeld: de werven langs de Oudegracht waar vroeger goederen werden gelost; nu terrassen en fietsers. (Illustratie – voorbeelddata)",
      1912,
      52.09017,
      5.12112,
      { seed: 23, canal: true },
    ),
    photo(
      "sample-haarlem",
      "Straatbeeld Grote Markt",
      "Voorbeeld: paard-en-wagen en gaslantaarns maken plaats voor fietsen en bomen. (Illustratie – voorbeelddata)",
      1898,
      52.38123,
      4.63676,
      { seed: 37, rebuiltIndex: 3 },
    ),
    photo(
      "sample-leiden",
      "Breestraat",
      "Voorbeeld: winkelstraat rond 1920 en vandaag. (Illustratie – voorbeelddata)",
      1920,
      52.15901,
      4.49162,
      { seed: 52 },
    ),
    photo(
      "sample-delft",
      "Gracht bij de Oude Kerk",
      "Voorbeeld: grachtenpanden langs de Oude Delft. (Illustratie – voorbeelddata)",
      1931,
      52.01261,
      4.35541,
      { seed: 68, canal: true, rebuiltIndex: 2 },
    ),
    {
      id: "sample-video-groningen",
      kind: "video",
      title: "Marktdag op de Grote Markt",
      description: "Voorbeeld van een videopin. Vervang de bron door een archieffilm (bijv. een YouTube-link of mp4-bestand). (Voorbeelddata)",
      year: 1958,
      lat: 53.21868,
      lng: 6.56794,
      video: { type: "file", src: SAMPLE_VIDEO, mimeType: "video/mp4" },
      uploader: TEAM,
      createdAt: CREATED,
      isSample: true,
    },
    {
      id: "sample-video-maastricht",
      kind: "video",
      title: "Carnavalsoptocht op het Vrijthof",
      description: "Voorbeeld van een videopin met amateurfilm. (Voorbeelddata)",
      year: 1964,
      lat: 50.84873,
      lng: 5.68873,
      video: { type: "file", src: SAMPLE_VIDEO, mimeType: "video/mp4" },
      uploader: TEAM,
      createdAt: CREATED,
      isSample: true,
    },
  ];
}
