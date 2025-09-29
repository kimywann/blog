import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kimyngwan",
  description: "김영완의 기술 블로그입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <div className="min-h-screen">
          <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
