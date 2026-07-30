import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.joye-life.com"),
  title: { default: "Joye Life", template: "%s · Joye Life" },
  description: "Personal guidance for your goals, money, career, and next move.",
  applicationName: "Joye Life",
  icons: {
    icon: [
      { url: "/brand/favicon.ico" },
      { url: "/brand/favicon.png", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "Joye Life",
    description: "Your life. One clear next move.",
    type: "website",
    images: [{ url: "/brand/joye-og-image.png", width: 1200, height: 630, alt: "Joye Life" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Joye Life",
    description: "Your life. One clear next move.",
    images: ["/brand/joye-og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#070916",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
