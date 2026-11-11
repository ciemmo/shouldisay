// src/app/(dashboard)/analytics/page.tsx
// Analytics page - usage stats and insights

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface AnalyticsData {
  totalAnalyses: number;
  analysesThisMonth: number;
  avgSeverity: number;
  verdictBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: Array<{ month: string; count: number }>;
  severityTrend: Array<{ month: string; avgSeverity: number }>;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    const controller = new AbortController();
    fetch("/api/analytics", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch analytics");
        return response.json() as Promise<AnalyticsData>;
      })
      .then(setAnalytics)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Analytics error:", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [session?.user]);

  const verdictConfig = {
    GOOD: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Good" },
    OK: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "OK" },
    CAUTION: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, label: "Caution" },
    NOT_OK: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Not OK" },
    BAD: { color: "bg-red-200 text-red-900", icon: XCircle, label: "Bad" },
  };

  if (!session?.user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Sign in to View Analytics</h1>
        <p className="text-muted-foreground mb-6">
          Create an account or sign in to see your communication insights.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalAnalyses === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Your communication insights will appear here after you run some analyses.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 pb-12 text-center">
            <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No data yet</h3>
            <p className="text-muted-foreground mb-6">
              Start analyzing messages to see your communication patterns and trends.
            </p>
            <a href="/dashboard/analyze" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Run First Analysis
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your communication patterns and improvement over time.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
                <p className="text-3xl font-bold">{analytics.totalAnalyses}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-brand-muted flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-brand" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">{analytics.analysesThisMonth}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-brand-muted flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-brand" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Severity</p>
                <p className="text-3xl font-bold">{analytics.avgSeverity.toFixed(1)}/5</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-brand-muted flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-brand" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Most Common Verdict</p>
                <p className="text-xl font-bold">
                  {Object.entries(analytics.verdictBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-brand-muted flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-brand" />
              </div>
            </div>
            </CardContent>
        </Card>
      </div>

      {/* Verdict Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verdict Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.verdictBreakdown).map(([verdict, count]) => {
                const config = verdictConfig[verdict as keyof typeof verdictConfig];
                const percentage = ((count / analytics.totalAnalyses) * 100).toFixed(1);
                const Icon = config?.icon || CheckCircle;
                return (
                  <div key={verdict} className="flex items-center gap-4">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", config?.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{config?.label || verdict}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Detected Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([category, count]) => {
                  const percentage = ((count / analytics.totalAnalyses) * 100).toFixed(1);
                  return (
                    <div key={category} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate">{category}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Monthly Analysis Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 px-2 py-4">
            {analytics.monthlyTrend.map((item, idx) => {
              const maxCount = Math.max(...analytics.monthlyTrend.map((m) => m.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2" style={{ minWidth: 40 }}>
                  <div
                    className="w-full bg-brand rounded-t transition-all duration-300 hover:bg-brand/80"
                    style={{ height: `${height}%`, minHeight: height > 0 ? 4 : 0 }}
                    title={`${item.month}: ${item.count} analyses`}
                  />
                  <span className="text-xs text-muted-foreground rotate-45 origin-bottom w-20 text-center">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {analytics.monthlyTrend.length} months of data
          </p>
        </CardContent>
      </Card>

      {/* Severity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Average Severity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 px-2 py-4">
            {analytics.severityTrend.map((item, idx) => {
              const height = (item.avgSeverity / 5) * 100;
              const color = "bg-brand";
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2" style={{ minWidth: 40 }}>
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${color}`}
                    style={{ height: `${height}%`, minHeight: height > 0 ? 4 : 0 }}
                    title={`${item.month}: ${item.avgSeverity.toFixed(1)}/5 avg severity`}
                  />
                  <span className="text-xs text-muted-foreground rotate-45 origin-bottom w-20 text-center">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Lower scores indicate messages that may need more revision.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}