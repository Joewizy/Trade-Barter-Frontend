'use client';

import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { Bell, Settings, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@suiet/wallet-kit";


export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur ">
      <div className="container flex h-20 max-w-screen-[1200px] items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full bg-cetus-primary/20 animate-pulse"></div>
            <div className="absolute inset-1 rounded-full bg-gradient-to-r from-cetus-primary to-cetus-accent"></div>
          </div>
          <span className="hidden font-bold sm:inline-block text-xl text-white">TRADE BARTER</span>
        </Link>
        <MainNav />
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <ConnectButton>
              <span className="flex flex-row items-center justify-center"><Wallet className="mr-2 h-4 w-4 text-black" /> Connect Wallet</span>
            </ConnectButton>
          </nav>
        </div>
      </div>
    </header>
  )
}

