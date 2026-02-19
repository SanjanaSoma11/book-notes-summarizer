import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookNotes — AI Book Summary Engine",
  description: "Multi-audience, citation-grounded book-notes summarizer powered by Google Gemini (free). Deploy on Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-grid">{children}</body>
    </html>
  );
}
