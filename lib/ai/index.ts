import type { Task, RunResult, Provider, ProviderName } from "./types";
import { priceOf, ZERO_USAGE } from "./models";
import { mockProvider } from "./providers/mock";
import { anthropicProvider } from "./providers/anthropic";
export * from "./types";
export { askTask, type AskInput, type AskOutput } from "./tasks/ask";
export { verdictTask, type VerdictInput, type VerdictOutput } from "./tasks/verdict";
export { ocrTask, type OcrInput, type OcrOutput } from "./tasks/ocr";
export { composeTask, type ComposeInput, type ComposeOutput } from "./tasks/compose";
export { supportTask, type SupportInput, type SupportOutput, type SupportTurn } from "./tasks/support";
export { reportTask, type ReportInput, type ReportOutput, type ReportReader } from "./tasks/report";
export { icpTask, IcpOutput as IcpOutputSchema, type IcpInput, type IcpOutput, type IcpBranch, type IcpAnswer, type IcpRecord } from "./tasks/icp";
export { icpPeopleTask, IcpPeople as IcpPeopleSchema, type IcpPeople, type IcpPeopleInput } from "./tasks/icp-people";
export { icpDemandTask, IcpDemand as IcpDemandSchema, type IcpDemand, type IcpDemandInput } from "./tasks/icp-demand";
export { icpMarketTask, IcpMarket as IcpMarketSchema, type IcpMarket, type IcpMarketInput } from "./tasks/icp-market";
export { icpActivationTask, IcpActivation as IcpActivationSchema, type IcpActivation, type IcpActivationInput } from "./tasks/icp-activation";
export { icpSynthesisTask, IcpSynthesis as IcpSynthesisSchema, type IcpSynthesis, type IcpSynthesisInput } from "./tasks/icp-synthesis";
export { Claim, Source, Band, PROVENANCE, HOUSE_STYLE } from "./tasks/icp-claim";
const PROVIDERS: Record<ProviderName, Provider> = {
  mock: mockProvider,
  anthropic: anthropicProvider,
};
function selectProvider(): ProviderName {
  const p = (process.env.AI_PROVIDER ?? "mock") as ProviderName;
  if (!PROVIDERS[p]) throw new Error(`Unknown AI_PROVIDER: ${p}`);
  // Fail safe, not open: no key means mock, not a 500 in front of a customer.
  if (p === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    console.warn("[ai] AI_PROVIDER=anthropic but no ANTHROPIC_API_KEY. Falling back to mock.");
    return "mock";
  }
  return p;
}
/** Models sometimes wrap JSON in fences despite instructions. Strip and parse. */
function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  // These are three different failures and they used to share one message,
  // which made them indistinguishable in production. An empty response, a
  // prose response, and a response truncated by max_tokens need different
  // fixes, so each says so.
  if (!cleaned) throw new Error("Model returned empty text");
  if (start === -1) throw new Error("No JSON in response. First 200 chars: " + cleaned.slice(0, 200));
  if (end === -1 || end < start) {
    throw new Error(
      "JSON truncated, no closing brace. Likely hit maxTokens. Length " +
      cleaned.length + ", tail: " + cleaned.slice(-120)
    );
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
/**
 * The single entry point for every AI call in ReadProspects.
 *
 * Nothing else in the codebase talks to a model. That means switching provider,
 * adding caching, adding a semantic cache, or logging spend per document is a
 * change in ONE file -- not an archaeology expedition through route handlers.
 */
export async function runAI<TIn, TOut>(
  task: Task<TIn, TOut>,
  input: TIn,
  opts: { documentId?: string; retries?: number } = {}
): Promise<RunResult<TOut>> {
  const started = Date.now();
  const providerName = selectProvider();
  if (providerName === "mock") {
    await PROVIDERS.mock.complete({
      tier: task.tier,
      cacheable: "",
      system: "",
      user: "",
      maxTokens: task.maxTokens,
    });
    const data = task.schema.parse(task.fixture(input));
    const result: RunResult<TOut> = {
      data,
      cost: { usd: 0, usage: { ...ZERO_USAGE }, model: "mock", cached: false },
      provider: "mock",
      ms: Date.now() - started,
    };
    logCost(task.id, result, opts.documentId);
    return result;
  }
  const provider = PROVIDERS[providerName];
  const req = {
    tier: task.tier,
    cacheable: task.cacheable(input),
    system: task.system(input),
    user: task.user(input),
    maxTokens: task.maxTokens,
    thinkingBudget: task.thinkingBudget,
    // Vision tasks (OCR) provide images; text tasks leave this undefined.
    images: task.images ? task.images(input) : undefined,
  };
  const retries = opts.retries ?? 1;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await provider.complete(req);
      const parsed = task.schema.parse(extractJson(completion.text));
      const result: RunResult<TOut> = {
        data: parsed,
        cost: priceOf(task.tier, completion.usage),
        provider: providerName,
        ms: Date.now() - started,
      };
      logCost(task.id, result, opts.documentId);
      return result;
    } catch (err) {
      lastErr = err;
      // A malformed response is worth one retry. A 401 is not.
      if (err instanceof Error && (/Anthropic 4\d\d/.test(err.message) || /stop_reason=max_tokens/.test(err.message) || /JSON truncated/.test(err.message))) break;
    }
  }
  throw new Error(`runAI[${task.id}] failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
/**
 * Cost per document is the number that tells you when -- and whether -- to
 * optimise. Log it from day one and you will never have to guess.
 * Swap console for your metrics sink when you have one.
 */
function logCost<T>(taskId: string, r: RunResult<T>, documentId?: string) {
  console.log(
    JSON.stringify({
      evt: "ai.call",
      task: taskId,
      documentId: documentId ?? null,
      provider: r.provider,
      model: r.cost.model,
      usd: r.cost.usd,
      cached: r.cost.cached,
      ms: r.ms,
      usage: r.cost.usage,
    })
  );
}


