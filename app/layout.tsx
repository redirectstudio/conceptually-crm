import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conceptually CRM",
  description: "Extraordinary podcast pipeline — built for Forbes Shannon & Aaron Bare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white antialiased">{children}</body>
    </html>
  );
}
