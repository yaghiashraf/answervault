import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = 'https://answervault.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'AnswerVault – Security Questionnaire Response Platform',
    template: '%s | AnswerVault',
  },
  description:
    'Respond to vendor security questionnaires 10× faster. Maintain a versioned Answer Library and Evidence Catalog powered by your GitHub repo. SIG, CAIQ, ISO 27001, SOC 2 ready. One-time $499 license.',
  keywords: [
    'security questionnaire',
    'vendor questionnaire',
    'SIG Lite',
    'CAIQ',
    'ISO 27001',
    'SOC 2',
    'security assessment',
    'answer library',
    'evidence catalog',
    'infosec compliance',
    'questionnaire response tool',
    'GitHub-native',
    'self-hosted',
  ],
  authors: [{ name: 'AnswerVault' }],
  creator: 'AnswerVault',
  publisher: 'AnswerVault',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'AnswerVault',
    title: 'AnswerVault – Security Questionnaire Response Platform',
    description:
      'Respond to vendor security questionnaires 10× faster. GitHub-native Answer Library + Evidence Catalog. One-time $499 self-hosted license.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'AnswerVault – Security Questionnaire Response Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnswerVault – Security Questionnaire Response Platform',
    description:
      'Respond to vendor security questionnaires 10× faster. GitHub-native, self-hosted, one-time $499.',
    images: [`${BASE_URL}/og-image.png`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: '/favicon.ico',  sizes: 'any' },
      { url: '/icon.svg',     type: 'image/svg+xml' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
