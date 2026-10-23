"use client";

import { useEffect, useState } from "react";
import { getFile, isIdbSrc } from "./fileStore";

/** Zet een MediaSrc (URL of `idb:<key>`) om naar een bruikbare URL voor <img>/<video>. */
export function useMediaSrc(src: string): { url: string | null; error: boolean } {
  const [state, setState] = useState<{ url: string | null; error: boolean }>(() =>
    isIdbSrc(src) ? { url: null, error: false } : { url: src, error: false },
  );

  useEffect(() => {
    if (!isIdbSrc(src)) {
      setState({ url: src, error: false });
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    setState({ url: null, error: false });
    getFile(src)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) return setState({ url: null, error: true });
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, error: false });
      })
      .catch(() => !cancelled && setState({ url: null, error: true }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return state;
}
