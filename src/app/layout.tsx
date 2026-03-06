import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ServiceWorkerRegistration } from "@/components/providers/sw-registration";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SHADOWBROKERS | Financial Intelligence",
  description: "AI-powered stock and ETF movement predictions based on real-time news analysis",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${jetbrainsMono.variable} font-mono antialiased bg-background text-foreground`}>
        <AuthProvider initialUser={user}>
          {children}
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}
