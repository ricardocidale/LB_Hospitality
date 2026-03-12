import type { PropertyPhoto } from "@shared/schema";

export type VariantSize = "thumb" | "card" | "hero" | "full" | "original";

export function getVariantUrl(
  photo: PropertyPhoto | { imageUrl: string; variants?: Record<string, string> | null },
  size: VariantSize,
): string {
  if (photo.variants && typeof photo.variants === "object") {
    const variants = photo.variants as Record<string, string>;
    if (variants[size]) return variants[size];
  }
  return photo.imageUrl;
}

export function getAvifVariantPath(webpPath: string): string {
  return webpPath.replace(/\.webp$/, ".avif");
}

export function getVariantSrcSet(
  photo: PropertyPhoto | { imageUrl: string; variants?: Record<string, string> | null },
): string {
  if (!photo.variants || typeof photo.variants !== "object") {
    return "";
  }

  const variants = photo.variants as Record<string, string>;
  const entries: string[] = [];

  if (variants.thumb) entries.push(`${variants.thumb} 400w`);
  if (variants.card) entries.push(`${variants.card} 800w`);
  if (variants.hero) entries.push(`${variants.hero} 1600w`);
  if (variants.full) entries.push(`${variants.full} 2400w`);

  return entries.join(", ");
}
