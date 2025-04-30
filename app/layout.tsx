import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "君はAIを論破できる？",
  description: "AI議論サイト",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
            <header className="bg-background border-b py-4 sticky top-0 z-10 backdrop-blur-sm bg-background/80">
              <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
                  君はAIを論破できる？
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    href="/hall-of-fame"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                    殿堂入り一覧
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="flex-grow">{children}</main>
            <footer className="py-6 border-t bg-muted/30">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} 君はAIを論破できる？ All rights reserved.</p>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
