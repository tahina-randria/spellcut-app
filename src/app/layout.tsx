import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpellCut — Les fautes dans tes videos, trouvees en un clic",
  description:
    "Drop ta video. SpellCut detecte chaque erreur d'orthographe, grammaire et typographie dans tes titres, lower thirds et sous-titres. Zero faux positif.",
  openGraph: {
    title: "SpellCut",
    description: "Les fautes dans tes videos, trouvees en un clic.",
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
