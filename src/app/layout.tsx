// layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'モバイルチャットアプリ',
  description: 'スマホで使いやすいチャットアプリ',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="overscroll-none touch-manipulation">{children}</body>
    </html>
  );
}