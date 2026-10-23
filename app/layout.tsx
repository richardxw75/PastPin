import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { MediaProvider } from "@/components/providers/MediaProvider";

export const metadata: Metadata = {
  title: "PastPin – toen & nu op de kaart",
  description: "Ontdek en deel historische foto's en video's op een interactieve kaart.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#467f26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="font-sans text-gray-900 antialiased">
        <AuthProvider>
          <MediaProvider>{children}</MediaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
