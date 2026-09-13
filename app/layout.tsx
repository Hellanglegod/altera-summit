import type { Metadata } from "next";
import { Cinzel_Decorative, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Altera Summit | Model United Nations Conference",
  description: "Forging Destiny Among the Stars - An elite Model United Nations conference blending cosmology with classical antiquity.",
  keywords: ["MUN", "Model United Nations", "Altera Summit", "conference", "diplomacy"],
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className={`${cinzelDecorative.variable} ${cormorantGaramond.variable} ${inter.variable} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}