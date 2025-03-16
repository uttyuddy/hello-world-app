// layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';

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
      <body className="overscroll-none touch-manipulation bg-gray-50">
        {/* 画面全体を中央寄せ */}
        <div className="min-h-screen flex items-center justify-center">
          {children}
        </div>
      </body>
    </html>
  );
}
