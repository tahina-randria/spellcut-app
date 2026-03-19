import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpellCut — Les fautes dans tes vid\u00e9os, trouv\u00e9es en un clic",
  description:
    "Drop ta vid\u00e9o. SpellCut d\u00e9tecte chaque erreur d'orthographe, grammaire et typographie dans tes titres, lower thirds et sous-titres. Z\u00e9ro faux positif.",
  openGraph: {
    title: "SpellCut",
    description: "Les fautes dans tes vid\u00e9os, trouv\u00e9es en un clic.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        style={{
          fontFamily:
            '"Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
