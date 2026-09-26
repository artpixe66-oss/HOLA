/** Redimensionne une image dans le navigateur et la renvoie en JPEG. */
export async function resizeImage(file: File, maxSide: number, quality = 0.88): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible"))), "image/jpeg", quality));
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Envoie l'image au stockage en ligne ; sans stockage, la garde en local (plus petite). */
export async function uploadImage(file: File): Promise<{ url: string; local: boolean }> {
  const big = await resizeImage(file, 1600);
  const form = new FormData();
  form.append("file", new File([big], "image.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (res.ok) return { url: (await res.json()).url, local: false };
  if (res.status !== 501) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
  const small = await resizeImage(file, 640, 0.8);
  return { url: await blobToDataUrl(small), local: true };
}

export const isHostedUrl = (u: string) => /^https?:\/\//.test(u);
