"use client";

import { useEffect, useRef, useState } from "react";

export default function PdfReader({ title, fileUrl, token }: { title: string; fileUrl: string; token: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading document...");
  const [pageCount, setPageCount] = useState(0);
  const renderedRef = useRef(false);

  // dwell tracking
  const currentPage = useRef<number | null>(null);
  const enteredAt = useRef<number>(0);
  const dwellMs = useRef<Record<number, number>>({});

  function send(kind: string, page: number | null, value: unknown) {
    const body = JSON.stringify({ token, kind, page, value });
    // sendBeacon survives the page being closed; fetch is the fallback.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/signal", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/signal", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
    }
  }

  function leavePage() {
    const p = currentPage.current;
    if (p !== null && enteredAt.current) {
      const delta = Date.now() - enteredAt.current;
      dwellMs.current[p] = (dwellMs.current[p] ?? 0) + delta;
      send("page_dwell", p, { ms: dwellMs.current[p] });
    }
  }

  useEffect(() => {
    if (!fileUrl || renderedRef.current) return;
    renderedRef.current = true;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjs.getDocument({ url: fileUrl }).promise;
        setPageCount(pdf.numPages);
        setStatus("");
        send("opened", null, { pages: pdf.numPages });

        const container = containerRef.current;
        if (!container) return;

        const wrappers: HTMLDivElement[] = [];

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.4 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";

          const wrapper = document.createElement("div");
          wrapper.dataset.page = String(n);
          wrapper.style.background = "#fff";
          wrapper.style.marginBottom = "16px";
          wrapper.style.borderRadius = "6px";
          wrapper.style.overflow = "hidden";
          wrapper.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          wrappers.push(wrapper);

          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
        }

        // Track which page is most in view; accumulate dwell on the previous one.
        const observer = new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((e) => e.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible) return;
            const p = Number((visible.target as HTMLElement).dataset.page);
            if (p === currentPage.current) return;

            leavePage(); // flush dwell for the page we are leaving
            currentPage.current = p;
            enteredAt.current = Date.now();
          },
          { threshold: [0.25, 0.5, 0.75] }
        );
        wrappers.forEach((w) => observer.observe(w));
      } catch (err) {
        setStatus("Could not render this document: " + (err instanceof Error ? err.message : String(err)));
      }
    })();

    // Flush dwell when the reader closes or backgrounds the tab.
    const onHide = () => leavePage();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") leavePage();
    });

    return () => window.removeEventListener("pagehide", onHide);
  }, [fileUrl, token]);

  return (
    <div style={{ minHeight: "100vh", background: "#E9EAEC", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #D3D6DA", padding: "14px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontSize: 12, color: "#6E7480", textTransform: "uppercase", letterSpacing: "0.08em" }}>BackRead</span>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: "2px 0 0" }}>{title}</h1>
      </header>
      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        {status && <p style={{ color: "#6E7480", fontSize: 14, textAlign: "center", padding: 40 }}>{status}</p>}
        <div ref={containerRef} />
        {pageCount > 0 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#6E7480", padding: "16px 0" }}>
            {pageCount} page{pageCount > 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
}
