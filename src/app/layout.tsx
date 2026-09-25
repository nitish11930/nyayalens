import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NyayaLens — Legal Notice Navigator',
  description: 'India-first legal notice navigator. Understand your legal notice, extract statutory timelines, and prepare for lawyer consultations. Informational civic assistance — not formal legal advice.',
  keywords: 'legal notice, India, NI Act, Section 138, cheque bounce, tenant notice, legal aid, DLSA',
  authors: [{ name: 'NyayaLens' }],
  robots: 'index, follow',
  openGraph: {
    title: 'NyayaLens — Legal Notice Navigator',
    description: 'Understand your legal notice. Prepare for what\'s next.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1f52',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
