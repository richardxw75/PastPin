"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LatLng, MediaItem, PhotoItem, Uploader, VideoItem, VideoSource } from "@/lib/types";
import { mediaStorage } from "@/lib/storage";
import { getSeedItems } from "@/lib/seed";
import { compressImage } from "@/lib/image";
import { deleteFile, putFile } from "@/lib/fileStore";
import { uid } from "@/lib/id";

interface BaseInput {
  title: string;
  description: string;
  year: number;
  location: LatLng;
  uploader: Uploader;
}

export interface PhotoInput extends BaseInput {
  thenFile: File;
  nowFile: File;
  nowYear: number;
}

export interface VideoInput extends BaseInput {
  /** Óf een bestand, óf een al geparste link. */
  file?: File;
  link?: VideoSource;
}

interface MediaContextValue {
  items: MediaItem[];
  ready: boolean;
  addPhoto: (input: PhotoInput) => Promise<PhotoItem>;
  addVideo: (input: VideoInput) => Promise<VideoItem>;
  remove: (id: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextValue | null>(null);

function filesOf(item: MediaItem): string[] {
  if (item.kind === "photo") return [item.thenImage, item.nowImage];
  return item.video.type === "file" ? [item.video.src] : [];
}

function baseFields(input: BaseInput) {
  return {
    id: uid(),
    title: input.title.trim(),
    description: input.description.trim(),
    year: input.year,
    lat: input.location.lat,
    lng: input.location.lng,
    uploader: input.uploader,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Bewaart door gebruikers toegevoegde media: metadata in localStorage,
 * bestanden in IndexedDB. Voorbeelddata wordt altijd meegeladen.
 */
export function MediaProvider({ children }: { children: ReactNode }) {
  const [userItems, setUserItems] = useState<MediaItem[]>([]);
  const [ready, setReady] = useState(false);
  const seedItems = useMemo(() => getSeedItems(), []);

  useEffect(() => {
    setUserItems(mediaStorage.load());
    setReady(true);
  }, []);

  /** Voegt een item toe en ruimt de bestanden op als opslaan mislukt. */
  const persist = useCallback(async <T extends MediaItem>(item: T): Promise<T> => {
    const next = [item, ...mediaStorage.load()];
    try {
      mediaStorage.save(next);
    } catch {
      await Promise.all(filesOf(item).map(deleteFile));
      throw new Error("De lokale opslag van je browser is vol. Verwijder eerst wat uploads.");
    }
    setUserItems(next);
    return item;
  }, []);

  const addPhoto = useCallback(
    async (input: PhotoInput) => {
      const [thenBlob, nowBlob] = await Promise.all([compressImage(input.thenFile), compressImage(input.nowFile)]);
      const [thenImage, nowImage] = await Promise.all([putFile(thenBlob), putFile(nowBlob)]);
      return persist<PhotoItem>({ ...baseFields(input), kind: "photo", thenImage, nowImage, nowYear: input.nowYear });
    },
    [persist],
  );

  const addVideo = useCallback(
    async (input: VideoInput) => {
      let video: VideoSource;
      if (input.file) {
        video = { type: "file", src: await putFile(input.file), mimeType: input.file.type || undefined };
      } else if (input.link) {
        video = input.link;
      } else {
        throw new Error("Kies een videobestand of plak een link.");
      }
      return persist<VideoItem>({ ...baseFields(input), kind: "video", video });
    },
    [persist],
  );

  const remove = useCallback(async (id: string) => {
    const current = mediaStorage.load();
    const item = current.find((i) => i.id === id);
    if (!item) return;
    const next = current.filter((i) => i.id !== id);
    mediaStorage.save(next);
    setUserItems(next);
    await Promise.all(filesOf(item).map(deleteFile)).catch(() => undefined);
  }, []);

  const items = useMemo(() => [...userItems, ...seedItems], [userItems, seedItems]);
  const value = useMemo(() => ({ items, ready, addPhoto, addVideo, remove }), [items, ready, addPhoto, addVideo, remove]);
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia(): MediaContextValue {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia moet binnen <MediaProvider> gebruikt worden.");
  return ctx;
}
