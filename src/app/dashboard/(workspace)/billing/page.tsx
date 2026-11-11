// src/app/(dashboard)/billing/page.tsx
// Billing page - subscription management

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Check,
  X,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  MessageSquare,
  BarChart2,
  Lock,
  HelpCircle,
} from "lucide-react";

interface Subscription {
  status: "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  analysesThisMonth: number;
  charsThisMonth: number;
  lastResetDate: string;
}

const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for trying out ShouldISay",
    features: [
      { icon: MessageSquare, label: "Unlimited single-message analyses" },
      { icon: Lock, label: "500 characters per analysis" },
      { icon: Shield, label: "Basic tone detection (3 categories)" },
      { icon: X, label: "Conversation context analysis", disabled: true },
      { icon: X, label: "Detailed rephrasing suggestions", disabled: true },
      { icon: X, label: "Analytics dashboard", disabled: true },
      { icon: X, label: "API access", disabled: true },
    ],
    limits: { maxChars: 500, contextAnalysis: false, suggestions: false },
    cta: "Current Plan",
    variant: "outline",
  },
  PRO: {
    name: "Pro",
    price: 9,
    period: "month",
    description: "For professionals who communicate daily",
    features: [
      { icon: MessageSquare, label: "Unlimited analyses" },
      { icon: Zap, label: "10,000 characters per analysis" },
      { icon: Shield, label: "Full tone detection (10+ categories)" },
      { icon: MessageSquare, label: "Conversation context analysis" },
      { icon: Zap, label: "Smart rephrasing suggestions" },
      { icon: BarChart2, label: "Analytics & usage dashboard" },
      { icon: Lock, label: "API access (coming soon)" },
      { icon: Check, label: "Priority processing" },
    ],
    limits: { maxChars: 10000, contextAnalysis: true, suggestions: true },
    cta: "Upgrade to Pro",
    variant: "default",
  },
};

type PlanKey = keyof typeof PLANS;

export default function BillingPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("FREE");

  useEffect(() => {
    if (!session?.user) return;

    const controller = new AbortController();
    fetch("/api/user", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch subscription");
        return response.json() as Promise<{
          subscription?: Subscription;
          usage?: Usage;
        }>;
      })
      .then((data) => {
        if (data.subscription) {
          setSubscription(data.subscription);
          setCurrentPlan(data.subscription.status === "ACTIVE" ? "PRO" : "FREE");
        }
        if (data.usage) setUsage(data.usage);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Failed to fetch subscription:", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [session?.user]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // In a real app, this would redirect to Stripe Checkout
      // For now, we'll simulate the upgrade
      alert("Stripe integration coming soon! This would redirect to Stripe Checkout.");
      // const response = await fetch("/api/subscription/checkout", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
      // });
      // if (response.ok) {
      //   const { url } = await response.json();
      //   window.location.href = url;
      // }
    } catch (error) {
      console.error("Upgrade failed:", error);
      alert("Failed to start upgrade. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = () => {
    alert("Stripe Billing Portal coming soon!");
    // In a real app: window.location.href = "/api/subscription/portal";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      FREE: { color: "bg-gray-100 text-gray-800", label: "Free" },
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
      TRIALING: { color: "bg-blue-100 text-blue-800", label: "Trial" },
      PAST_DUE: { color: "bg-orange-100 text-orange-800", label: "Past Due" },
      CANCELED: { color: "bg-red-100 text-red-800", label: "Canceled" },
    };
    return configs[status as keyof typeof configs] || configs.FREE;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const plan = PLANS[currentPlan];
  const isPro = currentPlan === "PRO";
  const statusConfig = getStatusBadge(subscription?.status || "FREE");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan, view usage, and update payment details.
        </p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-brand-muted flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">{plan.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPro && subscription?.currentPeriodEnd && (
                <div className="text-sm text-muted-foreground">
                  Renews {subscription.cancelAtPeriodEnd ? "on" : "auto-renews"}
                  {formatDate(subscription.currentPeriodEnd)}
                </div>
              )}
              <Button
                onClick={isPro ? handleManageBilling : handleUpgrade}
                disabled={isUpgrading}
                variant={plan.variant as "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"}
                className="gap-2"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isPro ? (
                  <>
                    Manage Billing
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {isPro && subscription?.currentPeriodEnd && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{usage?.analysesThisMonth || 0}</p>
                  <p className="text-xs text-muted-foreground">Analyses This Month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {(usage?.charsThisMonth || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Characters Processed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">Unlimited</p>
                  <p className="text-xs text-muted-foreground">Monthly Limit</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {plan.limits.maxChars.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Per Analysis</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(["FREE", "PRO"] as PlanKey[]).map((planKey) => {
            const p = PLANS[planKey];
            const isCurrent = planKey === currentPlan;
            return (
              <Card
                key={planKey}
                className={cn(
                  "relative h-full transition-all",
                  isCurrent
                    ? "border-brand-border bg-brand-muted shadow-lg ring-1 ring-brand/20"
                    : ""
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                      Current Plan
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="text-center">
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <div className="mt-2 flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">${p.price}</span>
                      {p.price > 0 && <span className="text-muted-foreground">/{p.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3" role="list">
                    {p.features.map((feature, idx) => {
                      const Icon = feature.icon;
                      const disabled = "disabled" in feature && feature.disabled;
                      return (
                        <li key={idx} className={cn("flex items-start gap-3", disabled && "opacity-50")}>
                          <div
                            className={cn(
                              "h-5 w-5 shrink-0 flex items-center justify-center rounded",
                              disabled ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700"
                            )}
                          >
                            {disabled ? (
                              <X className="h-3 w-3" />
                            ) : (
                              <Icon className="h-3 w-3" />
                            )}
                          </div>
                          <span className="text-sm mt-0.5">{feature.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    className="w-full mt-6 gap-2"
                    variant={p.variant as "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"}
                    onClick={planKey === "PRO" ? handleUpgrade : undefined}
                    disabled={isCurrent || isUpgrading}
                  >
                    {isUpgrading && planKey === "PRO" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      <>
                        {p.cta}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Usage Details (Pro only) */}
      {isPro && usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Period</CardTitle>
            <CardDescription>
              Resets on {formatDate(usage.lastResetDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Analyses Used</p>
                  <p className="text-3xl font-bold">{usage.analysesThisMonth}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Characters Processed</p>
                  <p className="text-3xl font-bold">{usage.charsThisMonth.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Character limit per analysis</span>
                  <span className="font-medium">{plan.limits.maxChars.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conversation context analysis</span>
                  <span className="font-medium">{plan.limits.contextAnalysis ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rephrasing suggestions</span>
                  <span className="font-medium">{plan.limits.suggestions ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ / Help */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-6 text-sm">
            <div>
              <dt className="font-medium mb-1">How does the character limit work?</dt>
              <dd className="text-muted-foreground">
                Free plans are limited to 500 characters per analysis. Pro plans get 10,000 characters.
                If you exceed the limit, you&apos;ll need to split your text or upgrade.
              </dd>
            </div>
            <div>
              <dt className="font-medium mb-1">Can I cancel my subscription anytime?</dt>
              <dd className="text-muted-foreground">
                Yes, you can cancel anytime from the billing portal. You&apos;ll retain Pro features until
                the end of your current billing period.
              </dd>
            </div>
            <div>
              <dt className="font-medium mb-1">What payment methods are accepted?</dt>
              <dd className="text-muted-foreground">
                We use Stripe for secure payments. All major credit cards, Apple Pay, and Google Pay
                are supported.
              </dd>
            </div>
            <div>
              <dt className="font-medium mb-1">Is my data used for training?</dt>
              <dd className="text-muted-foreground">
                No. Your messages are analyzed in real-time and never used to train our models.
                See our Privacy Policy for details.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}