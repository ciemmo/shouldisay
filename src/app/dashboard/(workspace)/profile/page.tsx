"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const name = user?.name || "Your profile";
  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          A quick overview of your ShouldISay account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" ? (
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-xl font-semibold text-brand">
                  {user ? initials : <User className="h-7 w-7" aria-hidden="true" />}
                </div>
              )}
              <dl className="grid flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="mt-1 font-medium">{status === "authenticated" ? name : "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="mt-1 break-all font-medium">{user?.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Plan</dt>
                  <dd className="mt-1 font-medium">
                    {user?.subscriptionStatus && user.subscriptionStatus !== "FREE" ? "Pro" : "Free"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <Link
            href="/dashboard/settings"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-brand"
          >
            Manage account settings
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
