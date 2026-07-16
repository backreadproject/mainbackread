import type { Provider, CompletionRequest, CompletionResult } from "../types";
import { ZERO_USAGE } from "../models";

/**
 * The mock provider never calls out. runAI() short-circuits to the task's
 * fixture before reaching here, so this exists only to satisfy the interface
 * and to simulate latency — so the UI's loading states get built honestly
 * rather than against an instant response that never happens in production.
 */
export const mockProvider: Provider = {
  name: "mock",
  async complete(_req: CompletionRequest): Promise<CompletionResult> {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 700));
    return { text: "", usage: { ...ZERO_USAGE } };
  },
};
