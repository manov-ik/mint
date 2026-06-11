import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { FloatingNav } from "@/components/FloatingNav";
import { FocusPill } from "@/components/FocusPill";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSync } from "@/components/ThemeSync";
import { Onboarding } from "@/components/Onboarding";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mint",
  description: "Mint - Minimal Habit and Task Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextAuthProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-on-background selection:bg-secondary/30">
          <ThemeProvider>
            <ThemeSync />
            <Onboarding />
            <FocusPill />
            <FloatingNav />
            <main className="flex-1 flex flex-col">{children}</main>
          </ThemeProvider>
        </body>
      </html>
    </NextAuthProvider>
  );
}
