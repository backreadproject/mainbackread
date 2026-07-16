"use client";

import { useEffect, useRef, useState } from "react";

export default function PdfReader({ title, fileUrl }: { title: string; fileUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading document...");
  const [pageCount, setPageCount] = useState(0);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!fileUrl || renderedRef.current) return;
    renderedRef.current = true;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Point the worker at a CDN build matching the installed version.
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjs.getDocument({ url: fileUrl }).promise;
        setPageCount(pdf.numPages);
        setStatus("");

        const container = containerRef.current;
        if (!container) return;

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

          const ctx = canvas.getContext("2d");
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        }
      } catch (err) {
        setStatus("Could not render this document: " + (err instanceof Error ? err.message : String(err)));
      }
    })();
  }, [fileUrl]);

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

