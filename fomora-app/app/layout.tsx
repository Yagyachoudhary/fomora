import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: "Fomora — Your AI Radar",
  description: "Personalized FOMO scores for every AI launch. Tells you what to actually care about."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-cream text-ink antialiased min-h-screen">{children}</body>
    </html>
  );
}
