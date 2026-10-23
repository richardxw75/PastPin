"use client";

import { useState } from "react";
import type { MediaItem, PhotoItem } from "@/lib/types";
import { useMediaSrc } from "@/lib/useMediaSrc";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMedia } from "@/components/providers/MediaProvider";
import { CURRENT_YEAR, formatCoords, formatDate, yearsAgo } from "@/lib/format";
import { CalendarIcon, CameraIcon, ExternalIcon, PinIcon, TrashIcon, UserIcon, VideoIcon, XIcon } from "@/components/ui/Icons";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { VideoPlayer } from "./VideoPlayer";

function PhotoComparison({ item }: { item: PhotoItem }) {
  const then = useMediaSrc(item.thenImage);
  const now = useMediaSrc(item.nowImage);

  if (then.error || now.error) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">Foto niet gevonden in lokale opslag.</div>;
  }
  if (!then.url || !now.url) return <div className="aspect-[4/3] animate-pulse rounded-xl bg-gray-200" />;

  return (
    <BeforeAfterSlider
      key={item.id}
      thenSrc={then.url}
      nowSrc={now.url}
      thenLabel={String(item.year)}
      nowLabel={String(item.nowYear ?? CURRENT_YEAR)}
      alt={item.title}
    />
  );
}

interface DetailPanelProps {
  item: MediaItem;
  onClose: () => void;
}

/** Zijpaneel (desktop) / bottom sheet (mobiel) met de media en metadata van een pin. */
export function DetailPanel({ item, onClose }: DetailPanelProps) {
  const { user } = useAuth();
  const { remove } = useMedia();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPhoto = item.kind === "photo";
  const canDelete = !item.isSample && user?.id === item.uploader.id;

  return (
    <aside
      aria-label={item.title}
      className="pointer-events-auto flex max-h-[78dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-2xl bg-white shadow-panel md:max-h-full md:animate-slide-in md:rounded-2xl"
    >
      <div className="flex justify-center pt-2 md:hidden">
        <span className="h-1.5 w-10 rounded-full bg-gray-300" />
      </div>

      <header className="flex items-start gap-3 px-5 pb-3 pt-3 md:pt-5">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isPhoto ? "bg-brand-100 text-brand-700" : "bg-video-100 text-video-700"
          }`}
        >
          {isPhoto ? <CameraIcon className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${isPhoto ? "text-brand-600" : "text-video-600"}`}>
            {isPhoto ? "Historische foto" : "Video"}
            {item.isSample && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 normal-case tracking-normal text-gray-500">voorbeeld</span>}
          </p>
          <h2 className="text-lg font-semibold leading-snug text-gray-900">{item.title}</h2>
        </div>
        <button onClick={onClose} className="-mr-1 rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Paneel sluiten">
          <XIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        {item.kind === "photo" ? <PhotoComparison item={item} /> : <VideoPlayer video={item.video} title={item.title} />}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarIcon /> Jaartal
            </dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {item.year} <span className="font-normal text-gray-500">· {yearsAgo(item.year)}</span>
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-gray-500">
              <UserIcon /> Geplaatst door
            </dt>
            <dd className="mt-0.5 truncate font-semibold text-gray-900">{item.uploader.name}</dd>
          </div>
        </dl>

        {item.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{item.description}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <PinIcon /> {formatCoords(item.lat, item.lng)}
          </span>
          <span>Toegevoegd op {formatDate(item.createdAt)}</span>
          <a
            href={`https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=18/${item.lat}/${item.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-medium text-brand-700 hover:underline"
          >
            Open in OpenStreetMap <ExternalIcon />
          </a>
        </div>

        {canDelete &&
          (confirmDelete ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              <span>Deze pin definitief verwijderen?</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 font-medium hover:bg-red-100">
                  Annuleren
                </button>
                <button
                  onClick={async () => {
                    await remove(item.id);
                    onClose();
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <TrashIcon /> Mijn pin verwijderen
            </button>
          ))}
      </div>
    </aside>
  );
}
