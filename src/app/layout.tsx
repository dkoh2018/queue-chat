import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/glass.css";
import "../styles/scrollbar.css";
import "../styles/forms.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jarvis",
  description: "ChatGPT interface clone",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" style={{colorScheme: 'dark'}}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white h-full`}
      >
        {children}
      </body>
    </html>
  );
}
