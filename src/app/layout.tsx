import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { BottomNav, TopNav } from "@/components/Nav";
import { isAdmin } from "@/lib/auth";
import "./globals.css";

// Tudo vem do banco e muda a cada jogo: renderiza sempre sob demanda.
export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "TCLÃ Poker", template: "%s · TCLÃ Poker" },
  description: "Torneios, premiação e ranking do TCLÃ Poker",
};

export const viewport: Viewport = {
  themeColor: "#0a110e",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const admin = await isAdmin();
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="text-xl text-gold">♠</span>
              <span>TCLÃ Poker</span>
            </Link>
            <TopNav />
            {admin ? (
              <form action={logout}>
                <button className="text-sm text-muted hover:text-text">Sair</button>
              </form>
            ) : (
              <Link href="/login" className="text-sm text-muted hover:text-text">
                Entrar
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:pb-12">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
