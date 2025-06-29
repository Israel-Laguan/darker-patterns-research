import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CacheProvider } from '@/contexts/CacheContext';
import { inter, lora, notoSans, openSans, spaceGrotesk } from '@/lib/fonts';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Dark Pattern Validator',
    default: 'Dark Pattern Validation Project',
  },
  description: 'A research platform for DPO dataset evaluation focused on dark patterns in LLMs.',
  keywords: [
    'dark patterns',
    'LLM evaluation',
    'DPO dataset',
    'research platform',
    'AI ethics',
    'user experience',
    'UX research',
  ],
  authors: [
    {
      name: 'Dark Pattern Validator Team',
      url: 'https://dark-pattern-validator-team.com',
    },
  ],
  creator: 'Dark Pattern Validator Team',
  openGraph: {
    title: 'Dark Pattern Validator',
    description: 'A research platform for DPO dataset evaluation focused on dark patterns in LLMs.',
    url: 'https://dark-pattern-validator.com',
    siteName: 'Dark Pattern Validator',
    images: [
      {
        url: 'https://dark-pattern-validator.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dark Pattern Validator OG Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dark Pattern Validator',
    description: 'A research platform for DPO dataset evaluation focused on dark patterns in LLMs.',
    images: ['https://dark-pattern-validator.com/og-image.png'],
    creator: '@darkpatternvalidator',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    noimageindex: false,
    noarchive: false,
    nosnippet: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${notoSans.variable} ${lora.variable} ${openSans.variable} dark flex min-h-screen flex-col antialiased`}
      >
        <AuthProvider>
          <CacheProvider>
            {children}
            <SonnerToaster richColors theme="dark" />
          </CacheProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
