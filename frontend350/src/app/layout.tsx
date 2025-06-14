// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import { UserProvider } from "@/context/AuthProvider"; // Update this import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Management",
  description: "Project 350 for SUST",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Create a client component wrapper */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

// Create a separate client component to wrap the providers
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </UserProvider>
  );
}
