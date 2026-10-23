"use client";

import { useEffect, useId, useState, type DragEvent } from "react";
import { CameraIcon, UploadIcon, XIcon } from "@/components/ui/Icons";

interface ImageDropzoneProps {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  tone: "sepia" | "brand";
}

/** Bestandskiezer met voorbeeld, slepen-en-neerzetten en directe camera-optie op mobiel. */
export function ImageDropzone({ label, hint, file, onChange, tone }: ImageDropzoneProps) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type.startsWith("image/")) onChange(dropped);
  };

  const badge = tone === "sepia" ? "bg-sepia-700 text-white" : "bg-brand-600 text-white";

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{label}</span>
        <span className="text-xs text-gray-500">{hint}</span>
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label={`${label} verwijderen`}
          >
            <XIcon className="h-4 w-4" />
          </button>
          <p className="truncate bg-white/90 px-3 py-1.5 text-xs text-gray-600">{file?.name}</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition ${
            over ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-gray-50"
          }`}
        >
          <div className="flex w-full gap-2">
            <label
              htmlFor={`${id}-file`}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:ring-brand-400"
            >
              <UploadIcon /> Kies bestand
            </label>
            <label
              htmlFor={`${id}-camera`}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:ring-brand-400 sm:hidden"
            >
              <CameraIcon /> Camera
            </label>
          </div>
          <span className="hidden text-xs text-gray-500 sm:block">of sleep een afbeelding hierheen</span>
          <input
            id={`${id}-file`}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
          <input
            id={`${id}-camera`}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </div>
      )}
    </div>
  );
}
