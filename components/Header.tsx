"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LogOutIcon, PinIcon, PlusIcon, UserIcon } from "@/components/ui/Icons";

interface HeaderProps {
  onAdd: () => void;
  onLogin: () => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function Header({ onAdd, onLogin }: HeaderProps) {
  const { user, ready, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <header
      className="relative z-[1200] flex h-14 shrink-0 items-center justify-between gap-3 border-b border-brand-100 bg-white px-4 md:h-16 md:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <a href="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <PinIcon className="h-5 w-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-bold tracking-tight text-gray-900">
            Past<span className="text-brand-600">Pin</span>
          </span>
          <span className="hidden text-xs text-gray-500 sm:block">Toen &amp; nu, op de kaart</span>
        </span>
      </a>

      <div className="flex items-center gap-2">
        <button
          onClick={onAdd}
          className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 md:flex"
        >
          <PlusIcon className="h-4 w-4" /> Media toevoegen
        </button>

        {ready &&
          (user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-brand-300 hover:ring-2"
                aria-label={`Account van ${user.name}`}
                aria-expanded={menuOpen}
              >
                {initials(user.name) || <UserIcon />}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl bg-white text-sm shadow-panel ring-1 ring-black/5">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50"
                  >
                    <LogOutIcon /> Uitloggen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Inloggen
            </button>
          ))}
      </div>
    </header>
  );
}
