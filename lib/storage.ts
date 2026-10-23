import type { MediaItem, User } from "./types";

const KEYS = {
  media: "pastpin.media.v1",
  users: "pastpin.users.v1",
  session: "pastpin.session.v1",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const mediaStorage = {
  load: () => read<MediaItem[]>(KEYS.media, []),
  save: (items: MediaItem[]) => write(KEYS.media, items),
};

/** Gesimuleerde gebruikersdatabase: alleen voor het prototype, niet veilig. */
export interface StoredUser extends User {
  passwordHash: string;
}

export const userStorage = {
  load: () => read<StoredUser[]>(KEYS.users, []),
  save: (users: StoredUser[]) => write(KEYS.users, users),
  loadSession: () => read<User | null>(KEYS.session, null),
  saveSession: (user: User | null) =>
    user ? write(KEYS.session, user) : window.localStorage.removeItem(KEYS.session),
};
