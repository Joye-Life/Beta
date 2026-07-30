import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Joye Life", template: "%s · Joye Life" },
  description: "Personal guidance for your goals, money, career, and next move.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
