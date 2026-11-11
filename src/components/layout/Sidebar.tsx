// src/components/layout/Sidebar.tsx
// Dashboard sidebar navigation

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  History,
  CreditCard,
  Settings,
  User,
  BarChart2,
} from "lucide-react";
import { useSession } from "next-auth/react";

const navigation = [
  { name: "Analyze", href: "/dashboard/analyze", icon: MessageSquare },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
];

const proNavigation = [
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPro = session?.user
    ? session.user.subscriptionStatus !== "FREE"
    : false;

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:pt-16">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6 pb-4">
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-col gap-y-7">
            <li>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Main
              </p>
              <ul role="list" className="mt-3 flex flex-col gap-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/70 hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {isPro && (
              <li className="mt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pro
                </p>
                <ul role="list" className="mt-3 flex flex-col gap-y-1">
                  {proNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/70 hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )}

            {!isPro && (
              <li className="mt-6">
                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                >
                  <CreditCard className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Upgrade to Pro
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="border-t border-border pt-4">
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/dashboard/profile"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-accent hover:text-foreground"
            )}
          >
            <User className="h-5 w-5 shrink-0" aria-hidden="true" />
            Profile
          </Link>
        </div>
      </div>
    </aside>
  );
}