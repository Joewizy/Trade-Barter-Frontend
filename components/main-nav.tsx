"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Menu,
  ArrowDownUp,
  Users,
  BookOpen,
  Handshake
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 hidden md:flex">
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/marketplace"
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-cetus-primary",
            pathname === "/marketplace" ? "text-cetus-primary" : "text-white font-bold"
          )}
        >
          <ArrowDownUp className="h-4 w-4" />
          <span>Trade</span>
        </Link>
        <Link
          href="/trades"
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-cetus-primary",
            pathname?.startsWith("/trades") ? "text-cetus-primary" : "text-white font-bold"
          )}
        >
          <Users className="h-4 w-4" />
          <span>My Trades</span>
        </Link>
        <Link
          href="/learn"
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-cetus-primary",
            pathname?.startsWith("/learn") ? "text-cetus-primary" : "text-white font-bold"
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>Learn & Earn</span>
        </Link>
        <Link
          href="/swap"
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-cetus-primary",
            pathname?.startsWith("/swap") ? "text-cetus-primary" : "text-white font-bold"
          )}
        >
          <Handshake className="h-4 w-4" />
          <span>Swap</span>
        </Link>
      </nav>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 bg-cetus-dark">
        <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
          <div className="relative h-8 w-8 mr-2">
            <div className="absolute inset-0 rounded-full bg-cetus-primary/20 animate-pulse"></div>
            <div className="absolute inset-1 rounded-full bg-gradient-to-r from-cetus-primary to-cetus-accent"></div>
          </div>
          <span className="font-bold text-xl text-white">FURIES</span>
        </Link>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-4">
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                pathname === "/marketplace" ? "text-cetus-primary" : "text-white font-bold"
              )}
            >
              <ArrowDownUp className="h-4 w-4" />
              <span>Trade</span>
            </Link>
            <Link
              href="/trades"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                pathname?.startsWith("/trades") ? "text-cetus-primary" : "text-white font-bold"
              )}
            >
              <Users className="h-4 w-4" />
              <span>My Trades</span>
            </Link>
            <Link
              href="/learn"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                pathname?.startsWith("/learn") ? "text-cetus-primary" : "text-white font-bold"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span>Learn & Earn</span>
            </Link>
            <Link
              href="/swap"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors",
                pathname?.startsWith("/swap") ? "text-cetus-primary" : "text-white font-bold"
              )}
            >
              <Handshake className="h-4 w-4" />
              <span>Swap</span>
            </Link>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
