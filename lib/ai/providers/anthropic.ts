import type { Provider, CompletionRequest, CompletionResult } from "../types";
import { MODELS } from "../models";

const ENDPOINT = "https://api.anthropic.com/v1/messages";

/**
 * The one thing that matters here: cache_control on the document block.
 * The document is byte-identical across every question from every reader for
 * the document's entire life. That is the ideal caching shape, and it takes
 * repeated input down to 10% of standard rate. Without it you are paying full
 * price to re-read the same deck a thousand times.
 */
export const anthropicProvider: Provider = {
  name: "anthropic",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set. Use AI_PROVIDER=mock to build without one.");

    const model = MODELS[req.tier].id;

    const system = [
      { type: "text", text: req.system },
      // Cached block goes LAST — the cache prefix must be stable, and anything
      // after a cache breakpoint is re-read every time.
      {
        type: "text",
        text: req.cacheable,
        cache_control: { type: "ephemeral" },
      },
    ];

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens,
        system,
        messages: [{ role: "user", content: req.user }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const u = data.usage ?? {};
    return {
      text,
      usage: {
        inputTokens: u.input_tokens ?? 0,
        outputTokens: u.output_tokens ?? 0,
        cacheReadTokens: u.cache_read_input_tokens ?? 0,
        cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
      },
    };
  },
};
