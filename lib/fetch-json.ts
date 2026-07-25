// One guarded fetch for the whole app.
//
// The bug this exists to kill: a route that throws returns an HTML error page,
// not JSON. An unguarded await res.json() then throws a parse error, the
// rejection is unhandled, and whatever set a busy flag never clears it. The
// button sits on "Working..." forever and the user is told nothing.
//
// Reading the body as text first means we can always say something true: the
// server's own error message when there is one, the status code when there is not.
export class FetchJsonError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchJsonError";
    this.status = status;
  }
}

export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 90000): Promise<T> {
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    clearTimeout(kill);
    if (e instanceof Error && e.name === "AbortError") {
      throw new FetchJsonError("This took too long and was stopped. Try again.", 0);
    }
    throw new FetchJsonError("Could not reach the server. Check your connection.", 0);
  }
  clearTimeout(kill);
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = null; }
  }
  if (json === null) {
    throw new FetchJsonError("Server returned " + res.status + " with no detail.", res.status);
  }
  if (!res.ok) {
    const obj = json as { error?: unknown };
    const msg = typeof obj.error === "string" && obj.error.trim() ? obj.error : "Request failed with status " + res.status + ".";
    throw new FetchJsonError(msg, res.status);
  }
  return json as T;
}

export function postJson<T>(url: string, body: unknown, timeoutMs?: number): Promise<T> {
  return fetchJson<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }, timeoutMs);
}

// Turns any thrown value into something safe to show a person.
export function errMsg(e: unknown, fallback: string): string {
  if (e instanceof FetchJsonError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
