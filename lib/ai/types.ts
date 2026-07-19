import { z } from "zod";
/**
 * The AI core is defined by TASKS, not by prompts scattered across the app.
 * A task owns: its schema, its model tier, its system prompt, and its fixture.
 * Adding an AI capability to BackRead means adding a task here -- nothing else.
 */
export type ModelTier = "fast" | "reason";
export type ProviderName = "mock" | "anthropic";
/** What every provider must implement. Swapping providers is a config change. */
export interface Provider {
  name: ProviderName;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}
/** An image to be read by a vision-capable model (OCR of a scanned page, an
 * uploaded image). Optional -- text-only tasks omit it entirely. */
export interface CompletionImage {
  mediaType: string;
  data: string;
}
export interface CompletionRequest {
  tier: ModelTier;
  /** Stable across calls -- this is what gets cached. Put the document here. */
  cacheable: string;
  /** Varies per call. The question, the signals. Never cached. */
  system: string;
  user: string;
  maxTokens: number;
  /** Optional images for vision tasks. Text-only requests leave this undefined. */
  images?: CompletionImage[];
}
export interface CompletionResult {
  text: string;
  usage: Usage;
}
export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}
export interface Cost {
  usd: number;
  usage: Usage;
  model: string;
  cached: boolean;
}
/** A task binds an input type to an output schema. */
export interface Task<TInput, TOutput> {
  id: string;
  tier: ModelTier;
  maxTokens: number;
  schema: z.ZodType<TOutput>;
  /** Stable content -- the document. Cached across every call for this doc. */
  cacheable(input: TInput): string;
  system(input: TInput): string;
  user(input: TInput): string;
  /** Optional images for vision tasks (OCR). Text tasks omit this. */
  images?(input: TInput): CompletionImage[];
  /** Deterministic stand-in so the product can be built with no API key. */
  fixture(input: TInput): TOutput;
}
export interface RunResult<T> {
  data: T;
  cost: Cost;
  provider: ProviderName;
  ms: number;
}
