import L from "leaflet";
import type { MediaKind } from "@/lib/types";

const GLYPHS: Record<MediaKind, string> = {
  photo:
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  video: '<path d="m16 13 5.2 3.1a.5.5 0 0 0 .8-.4V8.3a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
};

const cache = new Map<string, L.DivIcon>();

/** Druppelvormige pin met icoon, gekleurd per categorie (CSS in globals.css). */
export function mediaIcon(kind: MediaKind, active: boolean): L.DivIcon {
  const key = `${kind}-${active}`;
  let icon = cache.get(key);
  if (!icon) {
    const size = active ? 46 : 36;
    icon = L.divIcon({
      className: "",
      html: `<div class="pp-pin pp-pin--${kind}${active ? " pp-pin--active" : ""}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[kind]}</svg></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size * 1.2],
      tooltipAnchor: [0, -size * 1.1],
    });
    cache.set(key, icon);
  }
  return icon;
}

export const draftIcon = L.divIcon({
  className: "",
  html: '<div class="pp-draft"><span></span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const userLocationIcon = L.divIcon({
  className: "",
  html: '<div class="pp-me"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
