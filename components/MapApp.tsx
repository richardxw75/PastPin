"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { KindFilter, LatLng, MediaItem } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMedia } from "@/components/providers/MediaProvider";
import { Header } from "./Header";
import { FilterBar } from "./FilterBar";
import { DetailPanel } from "./media/DetailPanel";
import { AddMediaPanel } from "./upload/AddMediaPanel";
import { AuthModal } from "./auth/AuthModal";
import { CheckIcon, PinIcon, PlusIcon } from "./ui/Icons";

// Leaflet gebruikt `window`, dus de kaart wordt alleen in de browser geladen.
const MapView = dynamic(() => import("./map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-sm text-brand-700">Kaart laden…</div>
  ),
});

function matches(item: MediaItem, kind: KindFilter, query: string) {
  if (kind !== "all" && item.kind !== kind) return false;
  if (!query) return true;
  const haystack = `${item.title} ${item.description} ${item.uploader.name} ${item.year}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function MapApp() {
  const { user } = useAuth();
  const { items } = useMedia();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [draftLocation, setDraftLocation] = useState<LatLng | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [addAfterLogin, setAddAfterLogin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((i) => matches(i, kind, query.trim())), [items, kind, query]);
  const counts = useMemo(() => {
    const q = query.trim();
    return {
      all: items.filter((i) => matches(i, "all", q)).length,
      photo: items.filter((i) => matches(i, "photo", q)).length,
      video: items.filter((i) => matches(i, "video", q)).length,
    };
  }, [items, query]);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const openAdd = useCallback(() => {
    setSelectedId(null);
    setDraftLocation(null);
    setPickMode(false);
    setAddOpen(true);
  }, []);

  const requestAdd = () => {
    if (user) return openAdd();
    setAddAfterLogin(true);
    setAuthOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setPickMode(false);
    setDraftLocation(null);
  };

  const onDraftLocation = (loc: LatLng) => {
    setDraftLocation(loc);
    setPickMode(false);
  };

  const onCreated = (item: MediaItem) => {
    closeAdd();
    setKind("all");
    setQuery("");
    setSelectedId(item.id);
    setToast("Je pin staat op de kaart!");
  };

  // Uitloggen tijdens het toevoegen sluit het formulier.
  useEffect(() => {
    if (!user) {
      setAddOpen(false);
      setPickMode(false);
    }
  }, [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || authOpen) return;
      if (pickMode) setPickMode(false);
      else setSelectedId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [authOpen, pickMode]);

  const panelOpen = addOpen || !!selected;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <Header onAdd={requestAdd} onLogin={() => setAuthOpen(true)} />

      <main className="relative min-h-0 flex-1">
        <div className={`absolute inset-0 ${addOpen ? "pp-placing" : ""}`}>
          <MapView
            items={visibleItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            placing={addOpen}
            draftLocation={draftLocation}
            onDraftLocation={onDraftLocation}
          />
        </div>

        {/* Zoeken + filter, of de instructie tijdens het kiezen van een locatie */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] p-3 md:p-4">
          {pickMode ? (
            <div className="pointer-events-auto mx-auto flex max-w-md animate-fade-in items-center gap-3 rounded-2xl bg-gray-900/90 px-4 py-3 text-sm text-white shadow-panel md:mx-0">
              <PinIcon className="h-5 w-5 shrink-0 text-brand-300" />
              <span className="flex-1">
                <span className="md:hidden">Tik</span>
                <span className="hidden md:inline">Klik</span> op de kaart waar de opname gemaakt is.
              </span>
              <button onClick={() => setPickMode(false)} className="rounded-lg px-2 py-1 font-medium text-brand-200 hover:bg-white/10">
                Annuleer
              </button>
            </div>
          ) : (
            <div className={addOpen ? "hidden md:block" : ""}>
              <FilterBar kind={kind} onKindChange={setKind} query={query} onQueryChange={setQuery} counts={counts} />
              {visibleItems.length === 0 && (
                <p className="pointer-events-auto mt-2 w-fit rounded-xl bg-white px-3 py-2 text-sm text-gray-600 shadow-panel">
                  Geen resultaten voor deze zoekopdracht.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Zijpaneel (desktop) / bottom sheet (mobiel) */}
        {panelOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1150] flex max-h-full items-end md:inset-y-4 md:left-auto md:right-4 md:w-[420px] md:items-stretch">
            {addOpen ? (
              // Blijft gemount tijdens het kiezen op de kaart, zodat ingevulde gegevens behouden blijven.
              <div className={`w-full md:flex ${pickMode ? "hidden" : "flex"}`}>
                <AddMediaPanel
                  location={draftLocation}
                  onLocationChange={setDraftLocation}
                  onPickOnMap={() => setPickMode(true)}
                  onClose={closeAdd}
                  onCreated={onCreated}
                />
              </div>
            ) : (
              selected && <DetailPanel key={selected.id} item={selected} onClose={() => setSelectedId(null)} />
            )}
          </div>
        )}

        {/* Mobiele actieknop */}
        {!panelOpen && (
          <button
            onClick={requestAdd}
            className="absolute bottom-6 left-1/2 z-[1100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 font-semibold text-white shadow-panel transition active:scale-95 md:hidden"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <PlusIcon className="h-5 w-5" /> Media toevoegen
          </button>
        )}

        {toast && (
          <div
            role="status"
            className="absolute left-1/2 top-20 z-[1300] flex -translate-x-1/2 animate-fade-in items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-panel md:top-6"
          >
            <CheckIcon className="h-4 w-4" /> {toast}
          </div>
        )}
      </main>

      <AuthModal
        open={authOpen}
        reason={addAfterLogin ? "Log in of maak een account aan om media te plaatsen. Je naam wordt aan je pin gekoppeld." : undefined}
        onClose={() => {
          setAuthOpen(false);
          setAddAfterLogin(false);
        }}
        onSuccess={() => {
          setAuthOpen(false);
          if (addAfterLogin) openAdd();
          setAddAfterLogin(false);
        }}
      />
    </div>
  );
}
