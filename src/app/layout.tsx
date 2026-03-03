import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wooqer - Operations Platform",
  description: "Digital workplace and operations management platform for multi-location businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
