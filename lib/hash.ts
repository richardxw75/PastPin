/**
 * Hash van het wachtwoord voor de gesimuleerde login. Dit is géén echte beveiliging:
 * alles staat in de browser. Buiten een secure context ontbreekt crypto.subtle,
 * dan gebruiken we een eenvoudige FNV-1a hash.
 */
export async function hashPassword(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return "sha256:" + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "fnv:" + (h >>> 0).toString(16);
}
