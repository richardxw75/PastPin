"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import type { LatLng, MediaItem } from "@/lib/types";
import { LocateIcon } from "@/components/ui/Icons";
import { draftIcon, mediaIcon, userLocationIcon } from "./markerIcons";
import { BASE_LAYERS, BaseTileLayer, LayerSwitcher, loadBaseLayer, saveBaseLayer, type BaseLayerId } from "./BaseLayers";

export interface MapViewProps {
  items: MediaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** In plaatsmodus zet een klik op de kaart de locatie van de nieuwe pin. */
  placing: boolean;
  draftLocation: LatLng | null;
  onDraftLocation: (location: LatLng) => void;
}

const NL_CENTER: L.LatLngTuple = [52.2, 5.3];
const DESKTOP_PANEL_OFFSET = 220; // halve breedte van het zijpaneel

/** Vliegt naar een punt en houdt rekening met het zijpaneel (desktop) of de bottom sheet (mobiel). */
function FlyTo({ target }: { target: (LatLng & { key: string }) | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const zoom = Math.max(map.getZoom(), 15);
    const size = map.getSize();
    const desktop = size.x >= 768;
    const offset = desktop ? L.point(DESKTOP_PANEL_OFFSET, 0) : L.point(0, size.y * 0.36);
    const projected = map.project([target.lat, target.lng], zoom).add(offset);
    map.flyTo(map.unproject(projected, zoom), zoom, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.key]);
  return null;
}

function ClickHandler({ placing, onDraftLocation }: Pick<MapViewProps, "placing" | "onDraftLocation">) {
  useMapEvents({
    click(e) {
      if (placing) onDraftLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function LocateButton() {
  const map = useMap();
  const ref = useRef<HTMLButtonElement>(null);
  const [me, setMe] = useState<L.LatLng | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref.current) L.DomEvent.disableClickPropagation(ref.current);
    const onFound = (e: L.LocationEvent) => {
      setBusy(false);
      setMe(e.latlng);
    };
    const onError = () => setBusy(false);
    map.on("locationfound", onFound);
    map.on("locationerror", onError);
    return () => {
      map.off("locationfound", onFound);
      map.off("locationerror", onError);
    };
  }, [map]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => {
          setBusy(true);
          map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
        }}
        className="absolute bottom-[96px] left-[10px] z-[1000] flex h-[34px] w-[34px] items-center justify-center rounded-md border-2 border-black/20 bg-white text-gray-700 hover:bg-gray-50"
        aria-label="Toon mijn locatie"
        title="Toon mijn locatie"
      >
        <LocateIcon className={`h-[18px] w-[18px] ${busy ? "animate-pulse text-brand-600" : ""}`} />
      </button>
      {me && <Marker position={me} icon={userLocationIcon} interactive={false} />}
    </>
  );
}

export default function MapView({ items, selectedId, onSelect, placing, draftLocation, onDraftLocation }: MapViewProps) {
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const flyTarget = selected ? { lat: selected.lat, lng: selected.lng, key: selected.id } : null;

  // Refs zodat de (eenmalig gebonden) Leaflet-handlers altijd de actuele waarden zien.
  const placingRef = useRef(placing);
  placingRef.current = placing;

  const [baseLayer, setBaseLayer] = useState<BaseLayerId>(loadBaseLayer);
  const [failedLayers, setFailedLayers] = useState<BaseLayerId[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  const chooseLayer = (id: BaseLayerId) => {
    setBaseLayer(id);
    setFailedLayers((f) => f.filter((x) => x !== id));
    setNotice(null);
    saveBaseLayer(id);
  };

  // Valt automatisch terug op de volgende kaartdienst als de huidige niet laadt.
  const onLayerUnavailable = () => {
    const failed = [...failedLayers, baseLayer];
    setFailedLayers(failed);
    const current = BASE_LAYERS.find((l) => l.id === baseLayer)!;
    const next = BASE_LAYERS.find((l) => !failed.includes(l.id));
    if (next) {
      setBaseLayer(next.id);
      setNotice(`${current.sub} is niet bereikbaar; overgeschakeld naar ${next.sub}.`);
    } else {
      setNotice("Geen enkele kaartdienst is bereikbaar. Controleer je internetverbinding.");
    }
  };

  return (
    <MapContainer
      center={NL_CENTER}
      zoom={8}
      zoomControl={false}
      className="h-full w-full"
      worldCopyJump
    >
      <BaseTileLayer key={baseLayer} id={baseLayer} onUnavailable={onLayerUnavailable} />
      <LayerSwitcher value={baseLayer} onChange={chooseLayer} />
      {notice && (
        <div
          role="status"
          className="absolute left-1/2 top-[124px] z-[1000] w-[min(90%,28rem)] -translate-x-1/2 animate-fade-in rounded-xl bg-gray-900/90 px-4 py-2.5 text-center text-sm text-white shadow-panel md:bottom-6 md:top-auto"
        >
          {notice}
        </div>
      )}
      <ZoomControl position="bottomleft" />
      <LocateButton />
      <ClickHandler placing={placing} onDraftLocation={onDraftLocation} />
      <FlyTo target={flyTarget} />

      {items.map((item) => (
        <Marker
          key={item.id}
          position={[item.lat, item.lng]}
          icon={mediaIcon(item.kind, item.id === selectedId)}
          zIndexOffset={item.id === selectedId ? 1000 : 0}
          opacity={placing ? 0.55 : 1}
          eventHandlers={{
            click: (e) => {
              if (placingRef.current) onDraftLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
              else onSelect(item.id);
            },
          }}
        >
          {!placing && (
            <Tooltip direction="top" className="pp-tooltip">
              <strong>{item.title}</strong>
              <span>
                {item.kind === "photo" ? "Foto" : "Video"} · {item.year}
              </span>
            </Tooltip>
          )}
        </Marker>
      ))}

      {placing && draftLocation && (
        <Marker
          position={[draftLocation.lat, draftLocation.lng]}
          icon={draftIcon}
          draggable
          zIndexOffset={2000}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onDraftLocation({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
