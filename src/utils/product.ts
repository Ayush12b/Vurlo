/**
 * Unified safe image getter.
 * Supports both legacy `image` (string) and new `images` (array) fields.
 * Returns empty string (not "/fallback.jpg") so resolveProductImage
 * can apply the correct named fallback (Unsplash URL).
 */
export function getProductImage(
  product: { images?: string[] | Record<string, string[]>; image?: string; img?: string } | null | undefined,
): string {
  if (!product) return "";

  // Prefer images array or record (new format)
  if (product.images) {
    if (Array.isArray(product.images)) {
      if (product.images.length > 0) {
        const first = product.images[0];
        if (first && first.trim() !== "" && first !== "/fallback.jpg") return first;
      }
    } else {
      // It is a record/object of variants (e.g. { galaxy: [...], moon: [...] })
      const keys = ["galaxy", "moon", "saturn", "astronaut", ...Object.keys(product.images)];
      for (const key of keys) {
        const list = product.images[key];
        if (Array.isArray(list) && list.length > 0) {
          const first = list[0];
          if (first && first.trim() !== "" && first !== "/fallback.jpg") return first;
        }
      }
    }
  }

  // Fall back to legacy image string
  if (product.image && product.image.trim() !== "" && product.image !== "/fallback.jpg") {
    return product.image;
  }

  // Fall back to img field (ProductCard prop shape)
  if ((product as { img?: string }).img) {
    const img = (product as { img?: string }).img!;
    if (img.trim() !== "" && img !== "/fallback.jpg") return img;
  }

  // Return empty string — resolveProductImage will apply named fallback
  return "";
}
