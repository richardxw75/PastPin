import type { VideoSource } from "./types";

/** Herkent YouTube-, Vimeo- en directe videolinks (.mp4/.webm/.ogg/.mov). */
export function parseVideoUrl(input: string): VideoSource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { type: "embed", provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id =
      url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
    return id ? { type: "embed", provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{5,})/)?.[1];
    return id ? { type: "embed", provider: "vimeo", src: `https://player.vimeo.com/video/${id}` } : null;
  }
  if (/\.(mp4|webm|ogg|ogv|mov)$/i.test(url.pathname)) {
    return { type: "file", src: url.toString() };
  }
  return null;
}
