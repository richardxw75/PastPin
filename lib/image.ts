/**
 * Verkleint een foto in de browser (max. `maxSize` px aan de lange kant) en
 * zet hem om naar JPEG. Moderne browsers passen de EXIF-oriëntatie automatisch toe.
 */
export async function compressImage(file: File, maxSize = 1800, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Dit bestand is geen afbeelding.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kon de afbeelding niet verwerken.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Kon de afbeelding niet verwerken."))), "image/jpeg", quality),
  );
}
