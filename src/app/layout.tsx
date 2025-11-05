import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { OfflineProvider } from "@/providers/OfflineProvider";
import { geistSans, geistMono } from "@/lib/fonts";
import { Toaster } from "react-hot-toast";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PushNotificationInitializer } from "@/components/PushNotificationInitializer";

export const metadata: Metadata = {
  title: "ForeverPages - Create Beautiful Memorial Pages",
  description:
    "Create and share beautiful memorial pages to honor and remember your loved ones. A meaningful way to preserve memories and connect with family and friends.",
  keywords: ["memorial", "tribute", "remember", "family", "friends", "memorial pages"],
  authors: [{ name: "ForeverPages Team" }],
  creator: "ForeverPages",
  publisher: "ForeverPages",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ForeverPages - Create Beautiful Memorial Pages",
    description: "Create and share beautiful memorial pages to honor and remember your loved ones.",
    url: "/",
    siteName: "ForeverPages",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ForeverPages - Memorial Pages",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ForeverPages - Create Beautiful Memorial Pages",
    description: "Create and share beautiful memorial pages to honor and remember your loved ones.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <QueryProvider>
            <LanguageProvider>
              <ThemeProvider>
                <OfflineProvider>
                  {children}
                  <PWAInstallPrompt />
                  <PushNotificationInitializer />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: "#363636",
                        color: "#fff",
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: "#10B981",
                          secondary: "#fff",
                        },
                      },
                      error: {
                        duration: 5000,
                        iconTheme: {
                          primary: "#EF4444",
                          secondary: "#fff",
                        },
                      },
                    }}
                  />
                </OfflineProvider>
              </ThemeProvider>
            </LanguageProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
