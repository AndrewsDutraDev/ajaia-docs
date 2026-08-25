import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "Editor de documentos colaborativo e leve, inspirado no Google Docs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
