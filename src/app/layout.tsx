import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "A lightweight, collaborative document editor inspired by Google Docs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
