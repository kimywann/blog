import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

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
        <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4">
          <section className="mb-8 py-8">
            <Header />
          </section>
          <main className="flex-1">{children}</main>
          <section className="mt-auto py-15">
            <Footer />
          </section>
        </div>
      </body>
    </html>
  );
}
