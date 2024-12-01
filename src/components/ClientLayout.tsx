'use client';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { ThemeProvider } from 'next-themes'
import { chains, wagmiConfig, queryClient } from '@/lib/wagmi'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background">
              <Navbar />
              {mounted ? (
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
              ) : null}
            </div>
          </QueryClientProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </ThemeProvider>
  )
} 