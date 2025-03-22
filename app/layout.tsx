import type React from "react"
import type { Metadata } from "next"
import { Josefin_Sans as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import WalletProviderWrapper from "@/components/WalletProvider"
import { Toaster } from "@/components/ui/toaster"
import { GlobalProvider } from "@/context/global-context"


const fontSans = FontSans({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Furies P2P Exchange | Decentralized Crypto-Fiat Trading on Sui",
  description:
    "A decentralized P2P platform on the Sui blockchain that enables users to exchange cryptocurrencies for fiat securely with AI-powered dispute resolution.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background dark", fontSans.className)}>
        <WalletProviderWrapper>
          <GlobalProvider>
            {children}
          </GlobalProvider>
        </WalletProviderWrapper>
        <Toaster />
      </body>
    </html>
  )
}

