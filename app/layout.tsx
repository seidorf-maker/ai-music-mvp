import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Music Creation — MVP",
  description: "Generate music from a text prompt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-900 antialiased transition-colors duration-300 dark:from-neutral-950 dark:to-neutral-900 dark:text-neutral-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
