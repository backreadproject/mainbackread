import type { ModelTier, Usage, Cost } from "./types";

/**
 * Rates in USD per million tokens, verified July 2026.
 * Cache reads are 10% of base input. Cache writes are 1.25x (5-min TTL).
 * If these drift, this is the only place to change them.
 */
export const MODELS: Record<ModelTier, { id: string; inPerMTok: number; outPerMTok: number }> = {
  // Grounded Q&A over a small document. Exactly what Haiku is for.
  fast: { id: "claude-haiku-4-5", inPerMTok: 1.0, outPerMTok: 5.0 },
  // Multi-signal reasoning. This is the product. Do not cheap out here.
  reason: { id: "claude-sonnet-4-6", inPerMTok: 3.0, outPerMTok: 15.0 },
};

const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export function priceOf(tier: ModelTier, usage: Usage): Cost {
  const m = MODELS[tier];
  const usd =
    (usage.inputTokens * m.inPerMTok +
      usage.cacheReadTokens * m.inPerMTok * CACHE_READ_MULTIPLIER +
      usage.cacheWriteTokens * m.inPerMTok * CACHE_WRITE_MULTIPLIER +
      usage.outputTokens * m.outPerMTok) /
    1_000_000;

  return {
    usd: Math.round(usd * 1_000_000) / 1_000_000,
    usage,
    model: m.id,
    cached: usage.cacheReadTokens > 0,
  };
}

export const ZERO_USAGE: Usage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};
