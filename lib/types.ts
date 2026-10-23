export type MediaKind = "photo" | "video";

/**
 * Verwijzing naar een mediabestand. `src` is óf een gewone URL (http(s)/data:),
 * óf `idb:<key>` voor een bestand dat lokaal in IndexedDB staat.
 */
export type MediaSrc = string;

export interface Uploader {
  id: string;
  name: string;
}

interface BaseMediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  description: string;
  /** Jaartal waarin de (historische) opname gemaakt is. */
  year: number;
  lat: number;
  lng: number;
  uploader: Uploader;
  createdAt: string;
  /** Voorbeelddata die met de app meekomt (niet verwijderbaar). */
  isSample?: boolean;
}

export interface PhotoItem extends BaseMediaItem {
  kind: "photo";
  thenImage: MediaSrc;
  nowImage: MediaSrc;
  /** Jaartal van de recente foto. */
  nowYear: number;
}

export type VideoSource =
  | { type: "embed"; src: string; provider: "youtube" | "vimeo" }
  | { type: "file"; src: MediaSrc; mimeType?: string };

export interface VideoItem extends BaseMediaItem {
  kind: "video";
  video: VideoSource;
}

export type MediaItem = PhotoItem | VideoItem;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type KindFilter = "all" | MediaKind;
