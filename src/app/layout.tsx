import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ironman Kona Qualifying Analysis | 2025 vs 2026 System Comparison",
  description: "Comprehensive analysis comparing the 2025 and 2026 Ironman World Championship qualifying systems. See how the new slot allocation system affects qualification chances across all races and age groups.",
  keywords: ["Ironman", "Kona", "qualifying", "World Championship", "triathlon", "2025", "2026", "slot allocation", "age group", "analysis"],
  authors: [{ name: "Ironman Analysis Team" }],
  creator: "Ironman Analysis Platform",
  publisher: "Ironman Analysis Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ironman-analysis.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Ironman Kona Qualifying Analysis | 2025 vs 2026 System Comparison",
    description: "Comprehensive analysis comparing the 2025 and 2026 Ironman World Championship qualifying systems. See how the new slot allocation system affects qualification chances.",
    url: '/',
    siteName: 'Ironman Qualifying Analysis',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ironman Kona Qualifying Analysis | 2025 vs 2026 System Comparison", 
    description: "Comprehensive analysis comparing the 2025 and 2026 Ironman World Championship qualifying systems.",
    creator: '@ironmananalysis',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
