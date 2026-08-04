/**
 * What changed between two revisions.
 *
 * The mock's Note column says things like "added the agency disqualifier",
 * which is a diff of the generated prose. Generated prose is reworded on every
 * run even when nothing about the meaning moved, so diffing it would produce a
 * changelog of synonyms.
 *
 * The ANSWERS are different. They are stable question ids holding text a person
 * typed, so a difference there is a difference the person made on purpose.
 */

export type StoredAnswer = { id: string; q: string; a: string };

export type StoredAnswers = {
  sells: string;
  customerCount: number | null;
  items: StoredAnswer[];
  probes: StoredAnswer[];
};

export function readAnswers(v: unknown): StoredAnswers {
  const o = (v && typeof v === "object" ? v : {}) as Partial<StoredAnswers>;
  return {
    sells: typeof o.sells === "string" ? o.sells : "",
    customerCount: typeof o.customerCount === "number" ? o.customerCount : null,
    items: Array.isArray(o.items) ? o.items : [],
    probes: Array.isArray(o.probes) ? o.probes : [],
  };
}

export interface AnswerDiff {
  /** Questions whose answer text is different. Labelled as the person saw them. */
  changed: string[];
  /** Questions answered here that were blank or absent before. */
  added: string[];
  /** Questions that had an answer before and do not now. */
  removed: string[];
  /** The question set itself differs, which happens when the objective or the
   *  evidence branch changed. Every other count is then meaningless. */
  differentQuestions: boolean;
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ");

export function answerDiff(previous: unknown, next: unknown): AnswerDiff {
  const a = readAnswers(previous);
  const b = readAnswers(next);

  const prevById = new Map(a.items.map((x) => [x.id, x]));
  const nextById = new Map(b.items.map((x) => [x.id, x]));

  const sharedIds = [...nextById.keys()].filter((id) => prevById.has(id));
  // Fewer than half the questions in common means this is not the same
  // questionnaire, so a field by field comparison would compare strangers.
  const differentQuestions =
    a.items.length > 0 &&
    b.items.length > 0 &&
    sharedIds.length < Math.min(a.items.length, b.items.length) / 2;

  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const [id, item] of nextById) {
    const before = prevById.get(id);
    const now = norm(item.a);
    const then = before ? norm(before.a) : "";
    if (!then && now) added.push(item.q);
    else if (then && !now) removed.push(item.q);
    else if (then && now && then !== now) changed.push(item.q);
  }

  for (const [id, item] of prevById) {
    if (!nextById.has(id) && norm(item.a)) removed.push(item.q);
  }

  return { changed, added, removed, differentQuestions };
}

/** How the first revision of a profile is described: there is nothing before
 *  it, so counting changes against nothing would read as "everything changed". */
export function isFirst(revision: number): boolean {
  return revision <= 1;
}
