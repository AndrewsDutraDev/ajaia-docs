import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-lora", display: "swap" });

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "A lightweight, collaborative document editor inspired by Google Docs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="antialiased bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
