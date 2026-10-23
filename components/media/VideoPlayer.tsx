"use client";

import type { VideoSource } from "@/lib/types";
import { useMediaSrc } from "@/lib/useMediaSrc";

export function VideoPlayer({ video, title }: { video: VideoSource; title: string }) {
  const { url, error } = useMediaSrc(video.type === "file" ? video.src : "");

  const frame = "aspect-video w-full overflow-hidden rounded-xl bg-black";

  if (video.type === "embed") {
    return (
      <div className={frame}>
        <iframe
          src={video.src}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (error) {
    return <div className={`${frame} flex items-center justify-center text-sm text-white/70`}>Video niet gevonden in lokale opslag.</div>;
  }
  if (!url) return <div className={`${frame} animate-pulse`} />;

  return (
    <div className={frame}>
      <video src={url} controls playsInline preload="metadata" className="h-full w-full">
        Je browser kan deze video niet afspelen.
      </video>
    </div>
  );
}
