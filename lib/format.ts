export const CURRENT_YEAR = new Date().getFullYear();

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export function yearsAgo(year: number): string {
  const diff = CURRENT_YEAR - year;
  return diff <= 0 ? "dit jaar" : `${diff} jaar geleden`;
}
