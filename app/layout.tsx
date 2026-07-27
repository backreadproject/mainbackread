import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/inter";
import "./globals.css";
import MarketingSupport from "./MarketingSupport";
import ResponsiveStyles from "./(app)/ResponsiveStyles";
import ThemeScript from "./ThemeScript";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  if (host.includes("relaydocuments")) {
    return {
      title: "RelayDocuments: Fast and Secure Document Sharing",
      description: "RelayDocuments: Fast and Secure Document Sharing",
      icons: { icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNS41IiBmaWxsPSIjMTU5QTU2Ii8+PHBhdGggZD0iTTUgMTJoMTRNMTMgNmw2IDYtNiA2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMi4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=" },
    };
  }
  return {
    title: "ReadProspects: Documents Intelligence Platform",
    description: "ReadProspects: Documents Intelligence Platform",
    icons: { icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMwNzE4MTIiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzNFNkEyIiBzdHJva2Utd2lkdGg9IjUiLz48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSI3LjUiIGZpbGw9IiMzM0U2QTIiLz48L3N2Zz4=" },
  };
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        <ThemeScript />
        <ResponsiveStyles />
        {children}
        <MarketingSupport />
      </body>
    </html>
  );
}

