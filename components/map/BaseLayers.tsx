"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { TileLayer } from "react-leaflet";
import { CheckIcon, LayersIcon } from "@/components/ui/Icons";

/** Kaartdiensten die géén API-sleutel nodig hebben. De volgorde is ook de terugvalvolgorde. */
export const BASE_LAYERS = [
  {
    id: "osm",
    label: "Kaart",
    sub: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers',
    maxNativeZoom: 19,
  },
  {
    id: "light",
    label: "Licht",
    sub: "CARTO Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxNativeZoom: 20,
  },
  {
    id: "satellite",
    label: "Luchtfoto",
    sub: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, GIS User Community",
    maxNativeZoom: 19,
  },
] as const;

export type BaseLayerId = (typeof BASE_LAYERS)[number]["id"];

const STORAGE_KEY = "pastpin.baselayer";
/** Zoveel mislukte tegels zonder één geslaagde tegel → dienst onbereikbaar. */
const FAIL_THRESHOLD = 4;

export function loadBaseLayer(): BaseLayerId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (BASE_LAYERS.some((l) => l.id === saved)) return saved as BaseLayerId;
  } catch {
    /* opslag niet beschikbaar */
  }
  return "osm";
}

export function saveBaseLayer(id: BaseLayerId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* opslag niet beschikbaar */
  }
}

/** Tegellaag die `onUnavailable` aanroept als de dienst niet bereikbaar is. */
export function BaseTileLayer({ id, onUnavailable }: { id: BaseLayerId; onUnavailable: () => void }) {
  const layer = BASE_LAYERS.find((l) => l.id === id)!;
  const loaded = useRef(0);
  const failed = useRef(0);
  const reported = useRef(false);

  return (
    <TileLayer
      url={layer.url}
      attribution={layer.attribution}
      subdomains={"subdomains" in layer ? layer.subdomains : "abc"}
      maxNativeZoom={layer.maxNativeZoom}
      maxZoom={20}
      eventHandlers={{
        tileload: () => {
          loaded.current++;
        },
        tileerror: () => {
          failed.current++;
          if (!reported.current && loaded.current === 0 && failed.current >= FAIL_THRESHOLD) {
            reported.current = true;
            onUnavailable();
          }
        },
      }}
    />
  );
}

/** Knop + menu om de achtergrondkaart te kiezen. */
export function LayerSwitcher({ value, onChange }: { value: BaseLayerId; onChange: (id: BaseLayerId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div ref={ref} className="absolute bottom-[140px] left-[10px] z-[1000]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-[34px] w-[34px] items-center justify-center rounded-md border-2 border-black/20 bg-white text-gray-700 hover:bg-gray-50"
        aria-label="Kaartlaag kiezen"
        aria-expanded={open}
        title="Kaartlaag kiezen"
      >
        <LayersIcon className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div className="absolute bottom-0 left-11 w-48 animate-fade-in overflow-hidden rounded-xl bg-white text-sm shadow-panel ring-1 ring-black/5">
          {BASE_LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                onChange(l.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50"
            >
              <span>
                <span className="block font-medium text-gray-900">{l.label}</span>
                <span className="block text-xs text-gray-500">{l.sub}</span>
              </span>
              {value === l.id && <CheckIcon className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
