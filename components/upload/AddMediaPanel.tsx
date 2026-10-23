"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { LatLng, MediaItem, MediaKind } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMedia } from "@/components/providers/MediaProvider";
import { parseVideoUrl } from "@/lib/video";
import { CURRENT_YEAR, formatCoords } from "@/lib/format";
import { CameraIcon, CheckIcon, LinkIcon, LocateIcon, PinIcon, UploadIcon, VideoIcon, XIcon } from "@/components/ui/Icons";
import { ImageDropzone } from "./ImageDropzone";

interface AddMediaPanelProps {
  location: LatLng | null;
  onLocationChange: (location: LatLng) => void;
  /** Verbergt het paneel tijdelijk zodat de gebruiker op de kaart kan tikken (mobiel). */
  onPickOnMap: () => void;
  onClose: () => void;
  onCreated: (item: MediaItem) => void;
}

const MAX_VIDEO_MB = 250;
const FIRST_PHOTO_YEAR = 1826;
const FIRST_FILM_YEAR = 1888;

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-[16px] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
            done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {done ? <CheckIcon className="h-3.5 w-3.5" /> : n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Formulier om een historische foto (toen + nu) of video op de kaart te plaatsen. */
export function AddMediaPanel({ location, onLocationChange, onPickOnMap, onClose, onCreated }: AddMediaPanelProps) {
  const { user } = useAuth();
  const { addPhoto, addVideo } = useMedia();

  const [kind, setKind] = useState<MediaKind>("photo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [nowYear, setNowYear] = useState(String(CURRENT_YEAR));
  const [thenFile, setThenFile] = useState<File | null>(null);
  const [nowFile, setNowFile] = useState<File | null>(null);
  const [videoMode, setVideoMode] = useState<"file" | "link">("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState("");

  const [gpsState, setGpsState] = useState<"idle" | "busy" | "error">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locateWithGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsState("error");
      setGpsError("Je browser ondersteunt geen locatiebepaling.");
      return;
    }
    setGpsState("busy");
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsState("idle");
        onLocationChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGpsState("error");
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? window.isSecureContext
              ? "Toegang tot je locatie is geweigerd. Sta locatie toe in je browserinstellingen."
              : "GPS werkt alleen via https of localhost. Kies de plek op de kaart."
            : "Je locatie kon niet bepaald worden. Kies de plek op de kaart.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };

  const parsedLink = videoLink.trim() ? parseVideoUrl(videoLink) : null;
  const filesDone = kind === "photo" ? !!thenFile && !!nowFile : videoMode === "file" ? !!videoFile : !!parsedLink;
  const detailsDone = title.trim().length >= 3 && /^\d{4}$/.test(year);

  const validate = (): string | null => {
    if (!user) return "Log in om media toe te voegen.";
    if (!location) return "Kies een locatie op de kaart of gebruik je GPS.";
    if (kind === "photo") {
      if (!thenFile) return "Upload de historische foto (toen).";
      if (!nowFile) return "Upload ook een recente foto van exact dezelfde plek (nu).";
    } else if (videoMode === "file") {
      if (!videoFile) return "Kies een videobestand.";
      if (videoFile.size > MAX_VIDEO_MB * 1024 * 1024) return `De video is groter dan ${MAX_VIDEO_MB} MB.`;
    } else if (!parsedLink) {
      return "Plak een geldige YouTube-, Vimeo- of directe videolink (.mp4/.webm).";
    }
    if (title.trim().length < 3) return "Geef een titel van minimaal 3 tekens.";
    const y = Number(year);
    const minYear = kind === "photo" ? FIRST_PHOTO_YEAR : FIRST_FILM_YEAR;
    if (!Number.isInteger(y) || y < minYear || y > CURRENT_YEAR) return `Vul een jaartal in tussen ${minYear} en ${CURRENT_YEAR}.`;
    if (kind === "photo") {
      const ny = Number(nowYear);
      if (!Number.isInteger(ny) || ny < y || ny > CURRENT_YEAR) return `Het jaartal van de recente foto moet tussen ${y} en ${CURRENT_YEAR} liggen.`;
    }
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    if (!user || !location) return;

    setError(null);
    setBusy(true);
    try {
      const base = { title, description, year: Number(year), location, uploader: { id: user.id, name: user.name } };
      const item =
        kind === "photo"
          ? await addPhoto({ ...base, thenFile: thenFile!, nowFile: nowFile!, nowYear: Number(nowYear) })
          : await addVideo({ ...base, ...(videoMode === "file" ? { file: videoFile! } : { link: parsedLink! }) });
      onCreated(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan is mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      aria-label="Media toevoegen"
      className="pointer-events-auto flex max-h-[88dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-2xl bg-white shadow-panel md:max-h-full md:animate-slide-in md:rounded-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Media toevoegen</h2>
          {user && <p className="text-xs text-gray-500">Wordt geplaatst als {user.name}</p>}
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Formulier sluiten">
          <XIcon className="h-5 w-5" />
        </button>
      </header>

      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <Step n={1} title="Locatie" done={!!location}>
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                location ? "border-brand-200 bg-brand-50 text-brand-800" : "border-dashed border-gray-300 bg-gray-50 text-gray-600"
              }`}
            >
              <PinIcon className="h-5 w-5 shrink-0" />
              {location ? (
                <span>
                  <span className="font-medium">Locatie gekozen</span>
                  <span className="block font-mono text-xs">{formatCoords(location.lat, location.lng)}</span>
                  <span className="block text-xs text-brand-700/80">Sleep de pin op de kaart om bij te stellen.</span>
                </span>
              ) : (
                <span>
                  <span className="hidden md:inline">Klik op de kaart</span>
                  <span className="md:hidden">Tik op &lsquo;Kies op kaart&rsquo;</span> of gebruik je GPS om de plek vast te leggen.
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onPickOnMap}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700"
              >
                <PinIcon /> Kies op kaart
              </button>
              <button
                type="button"
                onClick={locateWithGps}
                disabled={gpsState === "busy"}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-60"
              >
                <LocateIcon className={gpsState === "busy" ? "animate-spin" : ""} />
                {gpsState === "busy" ? "Zoeken…" : "Mijn GPS"}
              </button>
            </div>
            {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
          </Step>

          <Step n={2} title="Type media" done>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type media">
              {(
                [
                  { value: "photo", label: "Historische foto", sub: "Toen & Nu", icon: CameraIcon, active: "border-brand-500 bg-brand-50 text-brand-800" },
                  { value: "video", label: "Video", sub: "Bestand of link", icon: VideoIcon, active: "border-video-500 bg-video-50 text-video-700" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === opt.value}
                  onClick={() => setKind(opt.value)}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition ${
                    kind === opt.value ? opt.active : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <opt.icon className="h-5 w-5" />
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs opacity-75">{opt.sub}</span>
                </button>
              ))}
            </div>
          </Step>

          <Step n={3} title={kind === "photo" ? "Foto's (beide verplicht)" : "Video"} done={filesDone}>
            {kind === "photo" ? (
              <div className="space-y-4">
                <p className="rounded-xl bg-sepia-50 p-3 text-xs leading-relaxed text-sepia-700">
                  Voor de &lsquo;Toen &amp; Nu&rsquo;-slider zijn twee foto&apos;s nodig. Maak de recente foto vanaf
                  exact hetzelfde standpunt en met dezelfde kijkrichting als de historische foto.
                </p>
                <ImageDropzone label="1. Toen" hint="de historische foto" file={thenFile} onChange={setThenFile} tone="sepia" />
                <ImageDropzone label="2. Nu" hint="recente foto, zelfde plek" file={nowFile} onChange={setNowFile} tone="brand" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium">
                  {(["file", "link"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setVideoMode(m)}
                      className={`flex items-center justify-center gap-1.5 rounded-full py-1.5 ${
                        videoMode === m ? "bg-white text-video-700 shadow-sm" : "text-gray-600"
                      }`}
                    >
                      {m === "file" ? <UploadIcon /> : <LinkIcon />}
                      {m === "file" ? "Bestand" : "Link"}
                    </button>
                  ))}
                </div>
                {videoMode === "file" ? (
                  <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600 hover:border-video-500">
                    <VideoIcon className="mx-auto mb-1 h-6 w-6 text-video-500" />
                    {videoFile ? (
                      <span className="font-medium text-gray-900">
                        {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    ) : (
                      <span>Kies of film een video (max. {MAX_VIDEO_MB} MB)</span>
                    )}
                    <input type="file" accept="video/*" className="sr-only" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
                  </label>
                ) : (
                  <div>
                    <input
                      className={inputClass}
                      type="url"
                      inputMode="url"
                      placeholder="https://www.youtube.com/watch?v=…"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                    />
                    <p className={`mt-1 text-xs ${videoLink && !parsedLink ? "text-red-600" : "text-gray-500"}`}>
                      {videoLink && !parsedLink
                        ? "Deze link wordt niet herkend."
                        : "YouTube, Vimeo of een directe link naar een .mp4/.webm-bestand."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Step>

          <Step n={4} title="Gegevens" done={detailsDone}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Titel</span>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Bijv. Stationsplein met tram"
              />
            </label>
            <div className={`grid gap-3 ${kind === "photo" ? "grid-cols-2" : "grid-cols-1"}`}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{kind === "photo" ? "Jaartal (toen)" : "Jaartal opname"}</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="1925"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              {kind === "photo" && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Jaartal (nu)</span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={nowYear}
                    onChange={(e) => setNowYear(e.target.value.replace(/\D/g, ""))}
                  />
                </label>
              )}
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Beschrijving <span className="font-normal text-gray-400">(optioneel)</span>
              </span>
              <textarea
                className={`${inputClass} min-h-[96px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Wat zie je? Wie maakte de opname? Bron of archief?"
              />
            </label>
          </Step>
        </div>

        <footer className="border-t border-gray-100 bg-white px-5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          {error && (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Bezig met opslaan…" : "Plaats op de kaart"}
          </button>
        </footer>
      </form>
    </aside>
  );
}
