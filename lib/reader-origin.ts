// The origin that all reader links must use -- the private document-delivery domain.
// Set NEXT_PUBLIC_READER_ORIGIN to e.g. "https://relaydocuments.com". If unset, we
// fall back to building it from NEXT_PUBLIC_READER_HOST, then to the current origin
// (so local dev without the env still works).
export function readerOrigin(fallbackOrigin?: string): string {
  const explicit = process.env.NEXT_PUBLIC_READER_ORIGIN;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");
  const host = process.env.NEXT_PUBLIC_READER_HOST;
  if (host && host.trim()) return `https://${host.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return (fallbackOrigin || "").replace(/\/+$/, "");
}

/** Build a full reader link for a share token, always on the reader domain. */
export function readerLink(token: string, fallbackOrigin?: string): string {
  return `${readerOrigin(fallbackOrigin)}/read/${token}`;
}
