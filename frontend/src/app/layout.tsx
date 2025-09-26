import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollectWise Chatbot",
  description: "AI-assisted debt negotiation interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
