import type { Metadata, Viewport } from 'next';
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-geist-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

/** Geometric neo-grotesk — Revolut-like product UI. */
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-revolut',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Oriel — Private home operations',
  description:
    'Optimize your home’s spending with clear, accountable private home operations in London.',
  applicationName: 'Oriel',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      {
        url: '/icons/oriel-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/oriel-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Oriel',
  },
};

export const viewport: Viewport = {
  themeColor: '#102a3e',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="redirect_uri" href="oriel://home-assistant/callback" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${jakarta.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
