import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { seller } from "@/lib/seller";
import { homeSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

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
  themeColor: "#F3EEE4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="font-ui min-h-full">{children}</body>
    </html>
  );
}
