"use client";

import type { KindFilter } from "@/lib/types";
import { SearchIcon, XIcon } from "@/components/ui/Icons";

interface FilterBarProps {
  kind: KindFilter;
  onKindChange: (kind: KindFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  counts: Record<KindFilter, number>;
}

const CHIPS: { value: KindFilter; label: string; dot?: string }[] = [
  { value: "all", label: "Alles" },
  { value: "photo", label: "Foto's", dot: "bg-brand-600" },
  { value: "video", label: "Video's", dot: "bg-video-500" },
];

/** Zwevende zoekbalk + categoriefilter; de gekleurde stippen dienen ook als legenda. */
export function FilterBar({ kind, onKindChange, query, onQueryChange, counts }: FilterBarProps) {
  return (
    <div className="pointer-events-auto w-full space-y-2 md:w-80">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Zoek op titel, plaats, jaar of maker…"
          aria-label="Zoeken"
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-[16px] shadow-panel outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 md:text-sm"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Zoekopdracht wissen"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter op type">
        {CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => onKindChange(chip.value)}
            aria-pressed={kind === chip.value}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm ring-1 transition ${
              kind === chip.value ? "bg-gray-900 text-white ring-gray-900" : "bg-white text-gray-700 ring-gray-200 hover:ring-gray-300"
            }`}
          >
            {chip.dot && <span className={`h-2.5 w-2.5 rounded-full ${chip.dot} ring-2 ring-white`} />}
            {chip.label}
            <span className={kind === chip.value ? "text-white/70" : "text-gray-400"}>{counts[chip.value]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
