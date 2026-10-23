"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { SliderIcon } from "@/components/ui/Icons";

interface BeforeAfterSliderProps {
  thenSrc: string;
  nowSrc: string;
  thenLabel: string;
  nowLabel: string;
  alt: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * 'Toen & Nu'-vergelijking: de historische foto ligt bovenop de recente foto en
 * wordt tot de sleepbalk afgesneden. Werkt met muis, touch en toetsenbord.
 */
export function BeforeAfterSlider({ thenSrc, nowSrc, thenLabel, nowLabel, alt }: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [aspect, setAspect] = useState(4 / 3);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPos(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setAnimate(false);
    setDragging(true);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) setFromClientX(e.clientX);
  };

  const stopDragging = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const jumpTo = (value: number) => {
    setAnimate(true);
    setPos(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const keys: Record<string, number> = {
      ArrowLeft: pos - step,
      ArrowDown: pos - step,
      ArrowRight: pos + step,
      ArrowUp: pos + step,
      Home: 0,
      End: 100,
    };
    if (e.key in keys) {
      e.preventDefault();
      setAnimate(false);
      setPos(clamp(keys[e.key], 0, 100));
    }
  };

  const transition = animate ? "transition-all duration-500 ease-out" : "";

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative w-full cursor-ew-resize select-none overflow-hidden rounded-xl bg-gray-200"
        style={{ aspectRatio: aspect, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        {/* Heden (onderlaag) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={nowSrc} alt={`${alt} – nu`} draggable={false} className="absolute inset-0 h-full w-full object-cover" />

        {/* Verleden (bovenlaag, afgesneden tot de sleepbalk) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thenSrc}
          alt={`${alt} – toen`}
          draggable={false}
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w && h) setAspect(clamp(w / h, 0.75, 1.9));
          }}
          className={`absolute inset-0 h-full w-full object-cover ${transition}`}
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        <span
          className="pointer-events-none absolute left-3 top-3 rounded-full bg-sepia-700/90 px-2.5 py-1 text-xs font-semibold text-white shadow transition-opacity"
          style={{ opacity: pos > 12 ? 1 : 0 }}
        >
          Toen · {thenLabel}
        </span>
        <span
          className="pointer-events-none absolute right-3 top-3 rounded-full bg-brand-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow transition-opacity"
          style={{ opacity: pos < 88 ? 1 : 0 }}
        >
          Nu · {nowLabel}
        </span>

        {/* Sleepbalk */}
        <div className={`pointer-events-none absolute inset-y-0 ${transition}`} style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)]" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Vergelijk toen en nu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}% toen`}
            onKeyDown={onKeyDown}
            className={`pointer-events-auto absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-lg outline-none ring-brand-300 focus-visible:ring-4 ${
              dragging ? "scale-110" : ""
            } transition-transform`}
          >
            <SliderIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium" role="group" aria-label="Snel wisselen">
        {[
          { label: `Toen (${thenLabel})`, value: 100, active: pos >= 99 },
          { label: "Vergelijk", value: 50, active: pos > 1 && pos < 99 },
          { label: `Nu (${nowLabel})`, value: 0, active: pos <= 1 },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => jumpTo(b.value)}
            aria-pressed={b.active}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              b.active ? "bg-white text-brand-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
