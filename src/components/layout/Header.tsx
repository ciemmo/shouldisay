// src/components/layout/Header.tsx
// Dashboard header with user menu

"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-bold text-xl">ShouldISay</Link>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </header>
    );
  }

  if (!session) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="font-bold text-xl">ShouldISay</Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard/analyze" className="font-bold text-xl">
            ShouldISay
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard/analyze"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              "hover:underline"
            )}
          >
            Analyze
          </Link>
          <Link
            href="/dashboard/history"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              "hover:underline"
            )}
          >
            History
          </Link>
          <Link
            href="/dashboard/billing"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              "hover:underline"
            )}
          >
            Billing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                  {session.user?.name?.[0] || session.user?.email?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium">
                {session.user?.name || session.user?.email}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Billing
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background border-t">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              <Link
                href="/dashboard/analyze"
                className="px-4 py-3 text-lg font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analyze
              </Link>
              <Link
                href="/dashboard/history"
                className="px-4 py-3 text-lg font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                History
              </Link>
              <Link
                href="/dashboard/billing"
                className="px-4 py-3 text-lg font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Billing
              </Link>
              <Link
                href="/dashboard/settings"
                className="px-4 py-3 text-lg font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-3 text-lg font-medium hover:bg-accent rounded-md text-left w-full"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}