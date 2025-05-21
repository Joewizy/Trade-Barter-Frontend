"use client";

import Link from "next/link";
import { useWallet } from "@suiet/wallet-kit";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Award, ArrowDownUp } from "lucide-react";
import CreateProfileForm from "@/components/create-profile-form";
import { useGlobalContext } from "@/context/global-context";

export default function Home() {
  const wallet = useWallet();
  const { profileCreated } = useGlobalContext();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {!wallet.connected ? (
          <section className="py-12 md:py-24 lg:py-32 text-center">
            <h2 className="text-3xl font-bold">Connect your wallet to continue</h2>
            <p className="mt-4 text-muted-foreground">Please connect your wallet to access the platform.</p>
          </section>
        ) : !profileCreated ? (
          <section className="py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-bold mb-6">Create Your Profile</h2>
              <CreateProfileForm />
            </div>
          </section>
        ) : (
          <>
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32">
              <div className="container max-w-[1200px] px-4 md:px-6">
                <div className="flex flex-col-reverse md:flex-row justify-between gap-6">
                  <div className="flex flex-col justify-center space-y-8 max-w-[600px]">
                    <div className="space-y-4">
                      <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-cetus-primary via-cetus-accent to-cetus-primary bg-clip-text text-transparent">
                        Decentralized P2P Exchange on Sui
                      </h1>
                      <p className="max-w-[600px] text-muted-foreground md:text-xl italic">
                        Exchange cryptocurrencies for fiat securely with AI-powered dispute resolution and earn NFT rewards
                        while learning about Web3.
                      </p>
                    </div>
                    <div className="flex flex-row gap-2">
                      <Link href="/marketplace">
                        <Button className="bg-gradient-to-r from-cetus-primary to-cetus-accent text-cetus-darker hover:opacity-90">
                          Trade P2P
                          <ArrowDownUp className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/swap">
                        <Button
                          variant="outline"
                          className="border-cetus-border bg-cetus-dark hover:bg-cetus-dark/80 hover:border-cetus-primary/50"
                        >
                          Start Learning
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="cetus-card animate-float">
                      <div className="relative h-full w-full">
                        <div className="absolute -top-6 -left-6 h-12 w-12 rounded-full bg-cetus-primary/20 animate-pulse"></div>
                        <div className="absolute -bottom-6 -right-6 h-12 w-12 rounded-full bg-cetus-accent/20 animate-pulse"></div>
                        <img
                          src="/assets/images/p2p_illustration.png"
                          alt="P2P Exchange Illustration"
                          className="rounded-lg object-cover"
                          width={400}
                          height={400}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-cetus-dark">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl cetus-text">Key Features</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Our platform combines the best of Web3 technology with user-friendly features
                    </p>
                  </div>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                  <div className="cetus-card flex flex-col justify-between">
                    <div className="space-y-2">
                      <Shield className="h-10 w-10 text-cetus-primary" />
                      <h3 className="text-xl font-bold">Secure P2P Trading</h3>
                      <p className="text-muted-foreground">
                        Exchange crypto for fiat with escrow protection and Sui blockchain security
                      </p>
                    </div>
                  </div>
                  <div className="cetus-card flex flex-col justify-between">
                    <div className="space-y-2">
                      <Zap className="h-10 w-10 text-cetus-accent" />
                      <h3 className="text-xl font-bold">AI Dispute Resolution</h3>
                      <p className="text-muted-foreground">Smart AI agents help resolve disputes quickly and fairly</p>
                    </div>
                  </div>
                  <div className="cetus-card flex flex-col justify-between">
                    <div className="space-y-2">
                      <Award className="h-10 w-10 text-cetus-primary" />
                      <h3 className="text-xl font-bold">Learn & Earn</h3>
                      <p className="text-muted-foreground">
                        Complete educational modules about Web3 and earn exclusive NFT rewards
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
