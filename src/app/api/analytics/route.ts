// src/app/api/analytics/route.ts
// GET endpoint for user analytics

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { z } from "zod";

const severitySchema = z.object({ level: z.number() });
const categoriesSchema = z.array(
  z.object({ category: z.string(), label: z.string() })
);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);

    // Fetch all analyses for the user
    const analyses = await prisma.analysis.findMany({
      where: {
        userId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        verdict: true,
        severity: true,
        categories: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const parsedAnalyses = analyses.map((analysis) => ({
      ...analysis,
      severity: severitySchema.parse(analysis.severity),
      categories: categoriesSchema.parse(analysis.categories),
    }));
    const totalAnalyses = parsedAnalyses.length;

    // This month
    const thisMonthStart = startOfMonth(now);
    const analysesThisMonth = parsedAnalyses.filter(
      (a) => a.createdAt >= thisMonthStart
    ).length;

    // Average severity
    const avgSeverity =
      parsedAnalyses.length > 0
        ? parsedAnalyses.reduce((sum, a) => sum + a.severity.level, 0) / parsedAnalyses.length
        : 0;

    // Verdict breakdown
    const verdictBreakdown: Record<string, number> = {};
    for (const a of parsedAnalyses) {
      verdictBreakdown[a.verdict] = (verdictBreakdown[a.verdict] || 0) + 1;
    }

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const a of parsedAnalyses) {
      for (const cat of a.categories) {
        categoryBreakdown[cat.label] = (categoryBreakdown[cat.label] || 0) + 1;
      }
    }

    // Monthly trend
    const monthlyTrend: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      const count = analyses.filter(
        (a) => a.createdAt >= monthStart && a.createdAt <= monthEnd
      ).length;
      monthlyTrend.push({
        month: format(monthStart, "MMM yyyy"),
        count,
      });
    }

    // Severity trend
    const severityTrend: Array<{ month: string; avgSeverity: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      const monthAnalyses = parsedAnalyses.filter(
        (a) => a.createdAt >= monthStart && a.createdAt <= monthEnd
      );
      const avg =
        monthAnalyses.length > 0
          ? monthAnalyses.reduce((sum, a) => sum + a.severity.level, 0) /
            monthAnalyses.length
          : 0;
      severityTrend.push({
        month: format(monthStart, "MMM yyyy"),
        avgSeverity: avg,
      });
    }

    return NextResponse.json({
      totalAnalyses,
      analysesThisMonth,
      avgSeverity,
      verdictBreakdown,
      categoryBreakdown,
      monthlyTrend,
      severityTrend,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}