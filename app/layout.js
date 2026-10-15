import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: "睡眠ログ",
  description: "Apple Healthの睡眠データビューア",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192' },
      { url: '/icon-512.png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="睡眠ログ" />
        <meta name="theme-color" content="#0e0e1c" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0e0e1c" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
