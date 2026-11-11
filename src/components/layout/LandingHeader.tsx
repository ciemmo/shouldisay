// src/components/layout/LandingHeader.tsx
// Minimal header for landing page - ChatGPT/Claude style

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "./BrandMark";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-foreground" aria-label="ShouldISay Home">
          <BrandMark />
          <span className="hidden sm:block">ShouldISay</span>
        </Link>

        {/* Actions */}
        <nav className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-9 px-4">
              Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="h-9 px-4">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-9 px-6 bg-brand text-brand-foreground hover:bg-brand/90">
              Get Started
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}