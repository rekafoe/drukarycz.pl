import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { seller } from "@/lib/seller";
import { homeSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: homeSeo.title,
  description: homeSeo.description,
  applicationName: seller.brand,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: seller.brand,
    locale: site.locale,
    title: homeSeo.title,
    description: homeSeo.description,
  },
  twitter: { card: "summary_large_image" },
  verification: {
    google: site.googleVerification || undefined,
    other: site.bingVerification ? { "msvalidate.01": site.bingVerification } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f0ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
