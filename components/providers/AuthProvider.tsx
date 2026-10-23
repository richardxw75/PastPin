"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { userStorage } from "@/lib/storage";
import { hashPassword } from "@/lib/hash";
import { uid } from "@/lib/id";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Gesimuleerde authenticatie: accounts en sessie staan in localStorage.
 * Voldoende om uploads aan een naam te koppelen; vervang door een echte
 * auth-provider (bijv. NextAuth/Supabase) voor productie.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(userStorage.loadSession());
    setReady(true);
  }, []);

  const startSession = useCallback((u: User) => {
    const session = { id: u.id, name: u.name, email: u.email };
    userStorage.saveSession(session);
    setUser(session);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const found = userStorage.load().find((u) => u.email === normalizeEmail(email));
      if (!found || found.passwordHash !== (await hashPassword(password))) {
        throw new Error("Onjuist e-mailadres of wachtwoord.");
      }
      startSession(found);
    },
    [startSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const users = userStorage.load();
      const normalized = normalizeEmail(email);
      if (users.some((u) => u.email === normalized)) {
        throw new Error("Er bestaat al een account met dit e-mailadres. Log in.");
      }
      const newUser = { id: uid(), name: name.trim(), email: normalized, passwordHash: await hashPassword(password) };
      userStorage.save([...users, newUser]);
      startSession(newUser);
    },
    [startSession],
  );

  const logout = useCallback(() => {
    userStorage.saveSession(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth moet binnen <AuthProvider> gebruikt worden.");
  return ctx;
}
