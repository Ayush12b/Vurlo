import { FirestoreProduct } from "@/hooks/use-products";

/**
 * Computes product recommendations locally based on attributes of the current product.
 * Used as an instant preview on frontend and as a fallback if the AI recommendation fails.
 */
export function getLocalRecommendations(
  currentProduct: FirestoreProduct,
  allProducts: FirestoreProduct[],
  limit = 4
): FirestoreProduct[] {
  if (!currentProduct || !allProducts || allProducts.length === 0) {
    return [];
  }

  // Filter candidates: exclude currentProduct and any product where active === false
  const candidates = allProducts.filter(
    (p) => p.id !== currentProduct.id && p.active !== false
  );

  const getScore = (candidate: FirestoreProduct): number => {
    let score = 0;

    // +3 if candidate.category === currentProduct.category
    if (
      candidate.category &&
      currentProduct.category &&
      candidate.category === currentProduct.category
    ) {
      score += 3;
    }

    // +2 if candidate.tags and currentProduct.tags share at least one value
    if (
      Array.isArray(candidate.tags) &&
      Array.isArray(currentProduct.tags) &&
      candidate.tags.some((tag) => currentProduct.tags?.includes(tag))
    ) {
      score += 2;
    }

    // +1 if candidate.price is within 30% of currentProduct.price
    if (
      typeof candidate.price === "number" &&
      typeof currentProduct.price === "number" &&
      currentProduct.price > 0
    ) {
      const diff = Math.abs(candidate.price - currentProduct.price);
      if (diff <= currentProduct.price * 0.3) {
        score += 1;
      }
    }

    // +1 if candidate.accent === currentProduct.accent
    if (
      candidate.accent &&
      currentProduct.accent &&
      candidate.accent === currentProduct.accent
    ) {
      score += 1;
    }

    return score;
  };

  // Score candidates
  const scoredCandidates = candidates.map((p) => ({
    product: p,
    score: getScore(p),
  }));

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  const results: FirestoreProduct[] = [];
  const addedIds = new Set<string>();

  // Take top `limit` with score > 0
  for (const item of scoredCandidates) {
    if (results.length >= limit) break;
    if (item.score > 0) {
      results.push(item.product);
      addedIds.add(item.product.id);
    }
  }

  // If fewer than limit, fill remaining slots with same category active products
  if (results.length < limit) {
    const sameCategoryFillers = candidates.filter(
      (p) => p.category === currentProduct.category && !addedIds.has(p.id)
    );
    for (const p of sameCategoryFillers) {
      if (results.length >= limit) break;
      results.push(p);
      addedIds.add(p.id);
    }
  }

  // If still fewer than limit, fill remaining slots with any active products
  if (results.length < limit) {
    const remainingFillers = candidates.filter((p) => !addedIds.has(p.id));
    for (const p of remainingFillers) {
      if (results.length >= limit) break;
      results.push(p);
      addedIds.add(p.id);
    }
  }

  return results;
}
