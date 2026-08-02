import type { Provider, CompletionRequest, CompletionResult } from "../types";
import { MODELS } from "../models";
const ENDPOINT = "https://api.anthropic.com/v1/messages";
/**
 * The one thing that matters here: cache_control on the document block.
 * The document is byte-identical across every question from every reader for
 * the document's entire life. That is the ideal caching shape, and it takes
 * repeated input down to 10% of standard rate. Without it you are paying full
 * price to re-read the same deck a thousand times.
 *
 * Vision: when a request carries images (OCR of a scanned page or an uploaded
 * image), they ride in the user message as image blocks ahead of the text. The
 * text-only path is unchanged, so ask/verdict behave exactly as before.
 */
export const anthropicProvider: Provider = {
  name: "anthropic",
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set. Use AI_PROVIDER=mock to build without one.");
    const model = MODELS[req.tier].id;
    // A task with nothing stable to cache -- OCR, where every document's
    // images are unique -- returns an empty cacheable, and Anthropic rejects
    // the whole request with "cache_control cannot be set for empty text
    // blocks". So the cached block is only emitted when there is something in
    // it. Before this guard ocrTask could never have worked at all, which is
    // why scanned PDFs and uploaded images both failed silently.
    const system: Record<string, unknown>[] = [{ type: "text", text: req.system }];
    if (req.cacheable && req.cacheable.trim().length > 0) {
      // Cached block goes LAST -- the cache prefix must be stable, and
      // anything after a cache breakpoint is re-read every time.
      system.push({
        type: "text",
        text: req.cacheable,
        cache_control: { type: "ephemeral" },
      });
    }
    // Build the user content. Text-only stays a plain string (unchanged behavior).
    // With images, prepend image blocks, then the text block.
    const userContent = (req.images && req.images.length > 0)
      ? [
          ...req.images.map((img) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: img.mediaType, data: img.data },
          })),
          { type: "text" as const, text: req.user },
        ]
      : req.user;
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
        ...(req.thinkingBudget && req.thinkingBudget > 0
          ? { thinking: { type: "enabled", budget_tokens: req.thinkingBudget } }
          : { thinking: { type: "disabled" } }),
        system,
        messages: [{ role: "user", content: userContent }],
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
    // When a response yields no text we are blind: extractJson reports only
    // "No JSON object in response", which is true but useless. Log what the
    // model actually returned so the cause is visible in one line.
    if (!text.trim()) {
      const kinds = (data.content ?? []).map((b: { type: string }) => b.type);
      console.error("[anthropic] empty text response", {
        model,
        stopReason: data.stop_reason ?? null,
        blockTypes: kinds,
        maxTokens: req.maxTokens,
      });
      throw new Error(
        "Model returned no text. stop_reason=" + (data.stop_reason ?? "unknown") +
        " blocks=[" + kinds.join(",") + "] maxTokens=" + req.maxTokens
      );
    }
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
