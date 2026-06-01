import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { themeInitScript } from "@/components/theme";

const SITE = "Signature Studio";
const DESC =
  "Design beautiful, customizable email signatures and export them straight to Gmail. Templates, social icons, UTM tracking, banners, vCard QR and more — free.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://signature-studio.vercel.app"
  ),
  title: {
    default: `${SITE} — Free Gmail email signature generator`,
    template: `%s · ${SITE}`,
  },
  description: DESC,
  keywords: [
    "email signature generator",
    "gmail signature",
    "html email signature",
    "free signature maker",
    "professional email signature",
  ],
  openGraph: {
    title: `${SITE} — Free Gmail email signature generator`,
    description: DESC,
    type: "website",
    siteName: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE} — Free Gmail email signature generator`,
    description: DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
