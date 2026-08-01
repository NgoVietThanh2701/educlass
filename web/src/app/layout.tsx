import type { Metadata } from "next";
import "./globals.css";
import { Inter, Lexend } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "EduClass",
  description: "EduClass LMS",
};

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["vietnamese", "latin"],
  variable: "--font-lexend",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, lexend.variable)}>
      <body>{children}</body>
    </html>
  );
}
