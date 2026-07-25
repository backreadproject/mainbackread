import { runAI, askTask, verdictTask } from "../lib/ai";
import { priceOf } from "../lib/ai/models";

const doc = `[Slide 7 — Pricing]
Starter $49/mo. Team $290/mo. Enterprise from $34,000 annually, 12-month commit.`;

async function main() {
  console.log("\n--- provider:", process.env.AI_PROVIDER ?? "mock", "(no API key required)\n");

  const guarded = await runAI(askTask, {
    documentText: doc,
    documentTitle: "Meridian — Series A",
    question: "Is the annual commit negotiable?",
    currentPage: 7,
  }, { documentId: "doc_demo" });
  console.log("GUARDRAIL →", guarded.data.escalate ? "escalated, refused to answer" : "ANSWERED — BUG", "\n", guarded.data.answer, "\n");

  const thin = await runAI(verdictTask, {
    documentText: doc, documentTitle: "Meridian", readerName: "Sarah", readerOrg: "Meridian",
    pages: [{ page: 1, title: "Cover", seconds: 4, visits: 1 }],
    backtracks: [], questionsAsked: [], replies: [], forwardedTo: [], openCount: 1,
  }, { documentId: "doc_demo" });
  console.log("THIN SIGNALS →", thin.data.confidence, "|", thin.data.headline, "\n");

  const rich = await runAI(verdictTask, {
    documentText: doc, documentTitle: "Meridian", readerName: "Sarah", readerOrg: "Meridian Capital",
    pages: [{ page: 7, title: "Pricing", seconds: 94, visits: 3 }],
    backtracks: ["returned from page 8 to page 7"],
    questionsAsked: ["Is the annual commit negotiable?"], replies: [],
    forwardedTo: ["finance@meridian.vc"], openCount: 3,
  }, { documentId: "doc_demo" });
  console.log("RICH SIGNALS →", rich.data.confidence, "|", rich.data.headline);
  console.log("            →", rich.data.nextAction, "\n");

  // What this WOULD cost on real rates, so there are no surprises later.
  const ask = priceOf("fast", { inputTokens: 250, outputTokens: 120, cacheReadTokens: 2800, cacheWriteTokens: 0 });
  const verdict = priceOf("reason", { inputTokens: 900, outputTokens: 300, cacheReadTokens: 3000, cacheWriteTokens: 0 });
  console.log("--- projected real cost (with prompt caching)");
  console.log(`ask     $${ask.usd.toFixed(5)}  → ${Math.floor(5 / ask.usd).toLocaleString()} on the $5 free credit`);
  console.log(`verdict $${verdict.usd.toFixed(5)}  → ${Math.floor(5 / verdict.usd).toLocaleString()} on the $5 free credit\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
