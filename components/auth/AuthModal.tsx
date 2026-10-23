"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Uitleg waarom inloggen nodig is, bijv. bij het toevoegen van media. */
  reason?: string;
}

type Mode = "login" | "register";

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-[16px] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export function AuthModal({ open, onClose, onSuccess, reason }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setPassword("");
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && name.trim().length < 2) return setError("Vul je naam in (minimaal 2 tekens).");
    if (password.length < 6) return setError("Het wachtwoord moet minimaal 6 tekens hebben.");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === "login" ? "Inloggen" : "Account aanmaken"}>
      {reason && <p className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">{reason}</p>}

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-full py-1.5 ${mode === m ? "bg-white text-brand-700 shadow-sm" : "text-gray-600"}`}
          >
            {m === "login" ? "Inloggen" : "Registreren"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Naam (zichtbaar bij je uploads)</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">E-mailadres</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Wachtwoord</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Even geduld…" : mode === "login" ? "Inloggen" : "Account aanmaken"}
        </button>
        <p className="text-center text-xs text-gray-500">
          Prototype: accounts worden alleen lokaal in deze browser opgeslagen.
        </p>
      </form>
    </Modal>
  );
}
