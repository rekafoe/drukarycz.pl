import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { seller } from "@/lib/seller";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: `${seller.brand} — własny nadruk`,
  description: "Koszulki i kubki z własnym projektem. Druk w Warszawie.",
};

export const viewport: Viewport = {
  themeColor: "#16130f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
